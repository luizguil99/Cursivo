import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const Chart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
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
        <Line
          type="monotone"
          dataKey="value"
          stroke="#B4902A"
          strokeWidth={2}
          dot={{
            fill: "#B4902A",
            r: 4,
          }}
          activeDot={{
            r: 6,
            fill: "#F3C92C",
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export { Chart };
