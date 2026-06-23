import { Tractor, TrendingUp, IndianRupee, Activity } from "lucide-react";

interface TopEquipmentCardProps {
  equipment: {
    name: string;
    type: string;
    bookings: number;
    revenue: number;
    utilization: number;
  } | null;
}

export function TopEquipmentCard({
  equipment,
}: TopEquipmentCardProps) {
  if (!equipment) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 text-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <Tractor className="h-10 w-10" />
          <div>
            <h3 className="font-display text-lg font-bold">
              Top Performing Equipment
            </h3>
            <p className="text-sm opacity-90">
              No equipment data available
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-lg bg-white/15 backdrop-blur px-3 py-2 text-sm">
          🚜 Add equipment and bookings to see insights
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 text-white p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide opacity-80">
            TOP PERFORMER
          </p>

          <h3 className="font-display text-2xl font-bold mt-1">
            {equipment.name}
          </h3>

          <p className="text-sm opacity-90 mt-1">
            {equipment.type}
          </p>
        </div>

        <TrendingUp className="h-12 w-12 opacity-90" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" />
          {equipment.bookings} Bookings
        </div>

        <div className="flex items-center gap-1.5">
          <IndianRupee className="h-3.5 w-3.5" />
          ₹{equipment.revenue}
        </div>

        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          {equipment.utilization}%
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-white/15 backdrop-blur px-3 py-2 text-xs">
        🏆 Most booked equipment in your fleet
      </div>
    </div>
  );
}