import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Goods = () => {
  const [goods, setGoods] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGoods();
  }, []);

  const fetchGoods = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/goods', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoods(res.data);
    } catch (err) {
      console.error('Failed to fetch goods:', err);
    }
  };

  const deleteGood = async (id) => {
    if (!window.confirm('Are you sure you want to delete this good?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/goods/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGoods();
    } catch (err) {
      console.error('Failed to delete good:', err);
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Goods</h2>
        <button className="btn btn-primary" onClick={() => navigate('/goods/add')}>
          + Add Good
        </button>
      </div>

      {goods.length === 0 ? (
        <p>No goods found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Weight</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {goods.map((good) => (
                <tr key={good.goods_id}>
                  <td>{good.goods_id}</td>
                  <td>{good.name}</td>
                  <td>{good.weight}</td>
                  <td>{good.type}</td>
                  <td>
                    <Link to={`/goods/edit/${good.goods_id}`} className="btn btn-sm btn-info me-2">
                      Edit
                    </Link>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteGood(good.goods_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Goods;
