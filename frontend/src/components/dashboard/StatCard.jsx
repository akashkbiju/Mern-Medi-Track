import Card from '../ui/Card';

const StatCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          {Icon && <Icon size={24} />}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
            {trend.value}
          </span>
          <span className="text-slate-500 ml-2">{trend.label}</span>
        </div>
      )}
    </Card>
  );
};

export default StatCard;
