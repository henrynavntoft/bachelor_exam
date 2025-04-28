'use client';

import { useEffect } from 'react';
import { useState } from 'react';
import Card from './components/Card';
import axios from 'axios';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function Home() {

  const apiUrl = 'http://localhost:4000';

  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [updateUser, setUpdateUser] = useState({ id: '', firstName: '', lastName: '', email: '' });

  useEffect(() => {
    axios.get(`${apiUrl}/users`)
      .then(response => setUsers(response.data.reverse()))
      .catch(error => console.error('Error fetching users:', error));
  }, []);

  const handleAddUser = () => {
    axios.post(`${apiUrl}/users`, {
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      password: newUser.password
    })
      .then(response => {
        setUsers([response.data, ...users]);
        setNewUser({ firstName: '', lastName: '', email: '', password: '' });
      })
      .catch(error => console.error('Error adding user:', error));
  };

  const handleUpdateUser = () => {
    axios.put(`${apiUrl}/users/${updateUser.id}`, {
      firstName: updateUser.firstName,
      lastName: updateUser.lastName,
      email: updateUser.email
    })
      .then(response => {
        setUsers(users.map(user => user.id === updateUser.id ? response.data : user));
        setUpdateUser({ id: '', firstName: '', lastName: '', email: '' });
      })
      .catch(error => console.error('Error updating user:', error));
  };

  const handleDeleteUser = (id: string) => {
    axios.delete(`${apiUrl}/users/${id}`)
      .then(() => {
        setUsers(users.filter(user => user.id !== id));
      })
      .catch(error => console.error('Error deleting user:', error));
  };


  return (
    <>
      <div className='flex flex-col gap-2'>
        {users.map(user => (
          <div key={user.id} className='flex flex-row gap-2'>
            <div onClick={() => setUpdateUser(user)} className='cursor-pointer'>
              <Card id={user.id} firstName={user.firstName} lastName={user.lastName} email={user.email} />
            </div>
            <button className='bg-red-500 text-white p-2 rounded-md' onClick={() => handleDeleteUser(user.id)}>Delete</button>
          </div>
        ))}
      </div>
      <div className='flex flex-col gap-2'>
        <h2 className='text-xl font-bold'>Add New User</h2>
        <input className='border-2 border-gray-300 rounded-md p-2' type="text" placeholder="First Name" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} />
        <input className='border-2 border-gray-300 rounded-md p-2' type="text" placeholder="Last Name" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} />
        <input className='border-2 border-gray-300 rounded-md p-2' type="text" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
        <input className='border-2 border-gray-300 rounded-md p-2' type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
        <button className='bg-blue-500 text-white p-2 rounded-md' onClick={handleAddUser}>Add User</button>
      </div>
      {updateUser.id !== '' && (
        <div className='flex flex-col gap-2 mt-4'>
          <h2 className='text-xl font-bold'>Update User</h2>
          <input className='border-2 border-gray-300 rounded-md p-2' type="text" placeholder="First Name" value={updateUser.firstName} onChange={(e) => setUpdateUser({ ...updateUser, firstName: e.target.value })} />
          <input className='border-2 border-gray-300 rounded-md p-2' type="text" placeholder="Last Name" value={updateUser.lastName} onChange={(e) => setUpdateUser({ ...updateUser, lastName: e.target.value })} />
          <input className='border-2 border-gray-300 rounded-md p-2' type="text" placeholder="Email" value={updateUser.email} onChange={(e) => setUpdateUser({ ...updateUser, email: e.target.value })} />
          <div className='flex gap-2'>
            <button className='bg-green-500 text-white p-2 rounded-md' onClick={handleUpdateUser}>Update</button>
            <button className='bg-gray-500 text-white p-2 rounded-md' onClick={() => setUpdateUser({ id: '', firstName: '', lastName: '', email: '' })}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
