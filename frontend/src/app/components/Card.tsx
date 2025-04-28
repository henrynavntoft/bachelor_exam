import React from 'react';

interface CardProps {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const Card = ({ id, firstName, lastName, email }: CardProps) => {
  return (
    <div className="card">
      <p>{id}</p>
      <h2>{firstName} {lastName}</h2>
      <p>{email}</p>
    </div>
  );
};

export default Card;