import PageHeader from "components/PageHeader";

const Header = ({ title, subtitle, action, statusLabel, eyebrow }) => (
  <PageHeader
    title={title}
    subtitle={subtitle}
    action={action}
    statusLabel={statusLabel}
    eyebrow={eyebrow}
  />
);

export default Header;
