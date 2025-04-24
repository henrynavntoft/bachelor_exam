import React from 'react';

interface CardProps {
  id: number;
  name: string;
  email: string;
}

const Card = ({ id, name, email }: CardProps) => {
  return (
    <div className="card">
      <p>{id}</p>
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
};  

export default Card;