import { PieChart as RechartsePieChart, Pie, ResponsiveContainer, Cell } from "recharts"

const COLORS = ['#F3C92C', '#B4902A', '#FFE17B', '#D4AF37', '#FFD700'];

const PieChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsePieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </RechartsePieChart>
    </ResponsiveContainer>
  )
}

export { PieChart }
