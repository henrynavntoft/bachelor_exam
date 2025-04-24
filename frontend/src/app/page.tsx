'use client';

import { useEffect } from 'react';
import { useState } from 'react';
import Card from './components/Card';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function Home() {

  const apiUrl = 'http://localhost:4000';

  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState<User>({ id: 0, name: '', email: '' });
  const [updateUser, setUpdateUser] = useState<User>({ id: 0, name: '', email: '' });

  useEffect(() => {
    axios.get(`${apiUrl}/users`)
      .then(response => setUsers(response.data.reverse()))
      .catch(error => console.error('Error fetching users:', error));
  }, []);

  const handleAddUser = () => {
    axios.post(`${apiUrl}/users`, newUser)
      .then(response => {
        setUsers([response.data, ...users]);
        setNewUser({ id: 0, name: '', email: '' });
      })  
      .catch(error => console.error('Error adding user:', error));
  };

  const handleUpdateUser = () => {
    axios.put(`${apiUrl}/users/${updateUser.id}`, updateUser)
      .then(response => { 
        setUsers(users.map(user => user.id === updateUser.id ? response.data : user));
        setUpdateUser({ id: 0, name: '', email: '' });
      })
      .catch(error => console.error('Error updating user:', error));
  };

  const handleDeleteUser = (id: number) => {
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
            <Card id={user.id} name={user.name} email={user.email} />
          </div>
          <button className='bg-red-500 text-white p-2 rounded-md' onClick={() => handleDeleteUser(user.id)}>Delete</button>
        </div>
      ))}
    </div>
    <div className='flex flex-col gap-2'>
      <h2 className='text-xl font-bold'>Add New User</h2>
      <input className='border-2 border-gray-300 rounded-md p-2' type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
      <input className='border-2 border-gray-300 rounded-md p-2' type="text" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
      <button className='bg-blue-500 text-white p-2 rounded-md' onClick={handleAddUser}>Add User</button>
    </div>
    {updateUser.id > 0 && (
      <div className='flex flex-col gap-2 mt-4'>
        <h2 className='text-xl font-bold'>Update User</h2>
        <input className='border-2 border-gray-300 rounded-md p-2' type="text" value={updateUser.name} onChange={(e) => setUpdateUser({ ...updateUser, name: e.target.value })} />
        <input className='border-2 border-gray-300 rounded-md p-2' type="text" value={updateUser.email} onChange={(e) => setUpdateUser({ ...updateUser, email: e.target.value })} />
        <div className='flex gap-2'>
          <button className='bg-green-500 text-white p-2 rounded-md' onClick={handleUpdateUser}>Update</button>
          <button className='bg-gray-500 text-white p-2 rounded-md' onClick={() => setUpdateUser({ id: 0, name: '', email: '' })}>Cancel</button>
        </div>
      </div>
    )}
    </>
  );
}
