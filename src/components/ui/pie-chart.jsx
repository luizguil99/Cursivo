import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = ['#F3C92C', '#B4902A', '#FFE17B', '#D4AF37', '#FFD700'];

const PieChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={0}
          outerRadius="80%"
          dataKey="value"
          startAngle={90}
          endAngle={-270}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.fill || COLORS[index % COLORS.length]} 
              strokeWidth={0}
            />
          ))}
        </Pie>
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

export { PieChart };
