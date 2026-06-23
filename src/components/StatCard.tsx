import { motion } from "framer-motion";

interface Props {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  delta?: string;
  tone?: "primary" | "secondary" | "info" | "warning";
  index?: number;
}

const toneMap = {
  primary: "from-primary/15 to-primary/5 text-primary",
  secondary: "from-secondary/20 to-secondary/5 text-secondary-foreground",
  info: "from-sky-500/15 to-sky-500/5 text-sky-600",
  warning: "from-warning/20 to-warning/5 text-warning-foreground",
};

export function StatCard({ title, value, icon: Icon, delta, tone = "primary", index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="font-display text-2xl sm:text-3xl font-bold mt-1.5">{value}</p>
          {delta && <p className="text-xs text-success mt-1 font-medium">{delta}</p>}
        </div>
        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
