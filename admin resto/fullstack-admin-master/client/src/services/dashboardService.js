import { collection } from "firebase/firestore";
import { mapDocument, normalizeNumber } from "lib/firestoreData";
import { COLLECTIONS } from "lib/firebaseCollections";
import { db } from "lib/firebaseApp";
import { subscribeToSnapshot } from "lib/firestoreRealtime";
import { mapFirebaseError } from "services/firebaseErrorService";
import { normalizeRole } from "lib/accessControl";

function computeMetrics(data) {
  const users = data.users.map((user) => ({
    ...user,
    approved: user.approved === true,
    balance: normalizeNumber(user.balance, 0),
    name: String(user.name || "").trim(),
    role: normalizeRole(user.role),
  }));

  const meals = data.meals.map((meal) => ({
    ...meal,
    active: meal.active !== false,
    price: normalizeNumber(meal.price, 0),
    day: String(meal.day || "").trim(),
    weekStart: String(meal.weekStart || "").trim(),
    name: String(meal.name || "").trim(),
  }));

  const reservations = data.reservations.map((item) => ({
    ...item,
    status: String(item.status || "reserved").trim(),
    priceSnapshot: normalizeNumber(item.priceSnapshot, 0),
    day: String(item.day || "").trim(),
    weekStart: String(item.weekStart || "").trim(),
    mealName: String(item.mealName || "").trim(),
    userName: String(item.userName || "").trim(),
  }));

  const balanceTransactions = data.balanceTransactions.map((item) => ({
    ...item,
    amount: normalizeNumber(item.amount, 0),
    balanceAfter: normalizeNumber(item.balanceAfter, 0),
    type: String(item.type || "").trim(),
    source: String(item.source || "").trim(),
    note: String(item.note || "").trim(),
    userId: String(item.userId || "").trim(),
    userName: String(item.userName || "").trim(),
    userEmail: String(item.userEmail || "").trim(),
    createdAt: String(item.createdAt || "").trim(),
  }));

  const activityLogs = data.activityLogs.map((item) => ({
    ...item,
    action: String(item.action || "").trim(),
    actorRole: String(item.actorRole || "").trim(),
    targetType: String(item.targetType || "").trim(),
    description: String(item.description || "").trim(),
    createdAt: String(item.createdAt || "").trim(),
  }));

  const currentWeekStart = new Date();
  const currentWeekday = currentWeekStart.getDay() || 7;
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekday + 1);
  const isoWeekStart = currentWeekStart.toISOString().slice(0, 10);

  const weeklyReservations = reservations.filter(
    (item) => item.weekStart === isoWeekStart
  );
  const todayIso = new Date().toISOString().slice(0, 10);

  const reservationsByDay = weeklyReservations.reduce((accumulator, item) => {
    const key = item.day || "N/A";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  const todayBalanceTransactions = balanceTransactions.filter((item) =>
    String(item.createdAt).slice(0, 10) === todayIso
  );

  return {
    users,
    meals,
    reservations,
    balanceTransactions,
    pendingUsers: users.filter((user) => !user.approved).length,
    approvedUsers: users.filter((user) => user.approved).length,
    totalEmployers: users.filter((user) => user.role === "employer").length,
    totalChefs: users.filter((user) => user.role === "chef").length,
    totalAdmins: users.filter((user) => user.role === "admin").length,
    totalSuperAdmins: users.filter((user) => user.role === "super_admin").length,
    activeMeals: meals.filter((meal) => meal.active).length,
    weeklyReservationsCount: weeklyReservations.length,
    reservationRevenueEstimate: weeklyReservations.reduce(
      (total, item) => total + item.priceSnapshot,
      0
    ),
    todayReservationsCount: reservations.filter((item) => item.day === todayIso)
      .length,
    activeReservationsCount: reservations.filter((item) =>
      ["reserved", "prepared", "ready"].includes(item.status)
    ).length,
    totalMeals: meals.length,
    totalBalanceTransactions: balanceTransactions.length,
    todayBalanceTransactionsCount: todayBalanceTransactions.length,
    todayBalanceTransactionsAmount: todayBalanceTransactions.reduce(
      (total, item) => total + item.amount,
      0
    ),
    todayBalanceTransactionsTotal: `${todayBalanceTransactions
      .reduce((total, item) => total + item.amount, 0)
      .toFixed(2)} TND`,
    totalChargedAmount: balanceTransactions.reduce(
      (total, item) => total + item.amount,
      0
    ),
    activityLogs,
    reservationsByDay,
    currentWeekStart: isoWeekStart,
    sections: {
      users: { available: true, error: "" },
      meals: { available: true, error: "" },
      reservations: { available: true, error: "" },
      balanceTransactions: { available: true, error: "" },
      activityLogs: { available: true, error: "" },
    },
  };
}

export function subscribeDashboardMetrics(callback, onError) {
  const state = {
    users: [],
    meals: [],
    reservations: [],
    balanceTransactions: [],
    activityLogs: [],
    sections: {
      users: { available: true, error: "" },
      meals: { available: true, error: "" },
      reservations: { available: true, error: "" },
      balanceTransactions: { available: true, error: "" },
      activityLogs: { available: true, error: "" },
    },
  };

  const emit = () =>
    callback({
      ...computeMetrics(state),
      sections: state.sections,
    });

  const subscriptions = [
    [COLLECTIONS.USERS, "users"],
    [COLLECTIONS.MEALS, "meals"],
    [COLLECTIONS.RESERVATIONS, "reservations"],
    [COLLECTIONS.BALANCE_TRANSACTIONS, "balanceTransactions"],
    [COLLECTIONS.ACTIVITY_LOGS, "activityLogs"],
  ].map(([collectionName, key]) =>
    subscribeToSnapshot(collection(db, collectionName), {
      label: `dashboard:${collectionName}`,
      onNext: (snapshot) => {
        state[key] = snapshot.docs.map(mapDocument);
        state.sections[key] = { available: true, error: "" };
        emit();
      },
      onError: (error) => {
        state[key] = [];
        state.sections[key] = {
          available: false,
          error: mapFirebaseError(error, `Impossible de charger ${collectionName}.`),
        };
        emit();
      }
    })
  );

  return () => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
  };
}
