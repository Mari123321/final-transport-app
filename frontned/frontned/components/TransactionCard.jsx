export default function TransactionCard({ tx }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4
      <td className="px-4 py-2">{tx.client}</td> 
      <td className="px-4 py-2">₹{tx.amount}</td>
      <td className="px-4 py-2">{tx.date}</td>
    </tr>
  );
}
