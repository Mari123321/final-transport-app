// components/Card.jsx
import { Link } from "react-router-dom";

const Card = ({ title, description, link }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all">
      <h2 className="text-lg font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link
        to={link}
        className="inline-block bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
      >
        View More
      </Link>
    </div>
  );
};

export default Card;
