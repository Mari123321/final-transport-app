import React from "react";

const ProfilePage = () => {
  const user = {
    name: "Lokesh K.",
    email: "lokesh@example.com",
    role: "Admin",
    joined: "April 2024",
    avatar: "https://ui-avatars.com/api/?name=Lokesh+K&background=random",
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center space-x-6">
          <img
            className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500 shadow-sm"
            src={user.avatar}
            alt="User avatar"
          />
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
            <p className="mt-1 text-sm text-gray-400">Role: {user.role}</p>
            <p className="text-sm text-gray-400">Joined: {user.joined}</p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Account Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Full Name</label>
              <div className="text-gray-800">{user.name}</div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email Address</label>
              <div className="text-gray-800">{user.email}</div>
            </div>
            <div>
              <label className="text-sm text-gray-500">User Role</label>
              <div className="text-gray-800">{user.role}</div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Joined On</label>
              <div className="text-gray-800">{user.joined}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
