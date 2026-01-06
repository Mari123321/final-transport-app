import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import AppDatePicker from '../components/common/AppDatePicker';

const ExpensesPage = () => {
	const [expenses, setExpenses] = useState([{ expenseType: '', amount: '', date: '', description: '' }]);

	const handleChange = (index, e) => {
		const { name, value } = e.target;
		setExpenses((prev) => {
			const updatedExpenses = [...prev];
			updatedExpenses[index][name] = value;
			return updatedExpenses;
		});
	};

	const handleAddExpenseRow = () => {
		setExpenses((prev) => [...prev, { expenseType: '', amount: '', date: '', description: '' }]);
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		console.log('Expenses:', expenses); // Replace with API call or other logic
		setExpenses([{ expenseType: '', amount: '', date: '', description: '' }]);
	};

	return (
		<div className="flex">
			<Sidebar />
			<main className="ml-60 p-6 w-full">
				<h1 className="text-2xl font-bold mb-4">Expenses</h1>
				<form onSubmit={handleSubmit} className="space-y-4 mb-6">
					{expenses.map((expense, index) => (
						<div key={index} className="space-y-4 border p-4 rounded mb-4">
							<div>
								<select
									name="expenseType"
									value={expense.expenseType}
									onChange={(e) => handleChange(index, e)}
									className="border p-2 w-full"
								>
									<option value="">Select Expense Type</option>
									<option value="Fuel">Fuel</option>
									<option value="Maintenance">Maintenance</option>
									<option value="Driver Salary">Driver Salary</option>
									<option value="Toll Charges">Toll Charges</option>
									<option value="Insurance">Insurance</option>
									<option value="Other">Other</option>
								</select>
							</div>
							<div>
								<input
									name="amount"
									value={expense.amount}
									onChange={(e) => handleChange(index, e)}
									type="number"
									placeholder="Amount"
									className="border p-2 w-full"
								/>
							</div>
							<div>
								<input
									name="date"
									value={expense.date}
									onChange={(e) => handleChange(index, e)}
									type="date"
									className="border p-2 w-full"
								/>
							</div>
							<div>
								<textarea
									name="description"
									value={expense.description}
									onChange={(e) => handleChange(index, e)}
									placeholder="Description"
									className="border p-2 w-full"
								/>
							</div>
						</div>
					))}
					<button
						type="button"
						onClick={handleAddExpenseRow}
						className="bg-green-500 text-white px-4 py-2 rounded"
					>
						Add Another Expense
					</button>
					<button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
						Submit Expenses
					</button>
				</form>
				<h2 className="text-xl font-bold mb-4">Expense List</h2>
				<ul className="list-disc pl-5">
					{expenses.map((expense, index) => (
						<li key={index}>
							<strong>{expense.expenseType}</strong>: ${expense.amount} on {expense.date} - {expense.description}
						</li>
					))}
				</ul>
			</main>
		</div>
	);
};

export default ExpensesPage;
