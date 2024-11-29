import { LineChart as RechartsLineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const LineChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsLineChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#F3C92C"
          strokeWidth={2}
          dot={{ fill: "#B4902A", strokeWidth: 2 }}
          activeDot={{ r: 8 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

export { LineChart }
