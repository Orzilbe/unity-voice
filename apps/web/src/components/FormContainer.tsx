import React, { PropsWithChildren } from 'react';

interface FormContainerProps extends PropsWithChildren {
  title?: string;
}

const FormContainer: React.FC<FormContainerProps> = ({ children, title }) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 w-full max-w-md transform transition-all duration-300 hover:shadow-2xl">
      {title && (
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{title}</h2>
      )}
      {children}
    </div>
  );
};

export default FormContainer;