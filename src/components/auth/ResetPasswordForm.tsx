import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

interface ResetPasswordFormProps {
  onClose: () => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{name?: string; resetPassword?: string; confirmPassword?: string}>({});
  const [successMessage, setSuccessMessage] = useState('');

  const getRegisteredIds = async (): Promise<string[]> => {
    return ['john', 'jane', 'bob'];
  };

  const validate = async () => {
    const newErrors: {name?: string; resetPassword?: string; confirmPassword?: string} = {};
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else {
      const registeredIds = await getRegisteredIds();
      if (!registeredIds.includes(name)) {
        newErrors.name = 'This name is not registered. Please check and try again.';
        isValid = false;
      }
    }

    if (!resetPassword) {
      newErrors.resetPassword = 'New password is required';
      isValid = false;
    } else if (resetPassword.length < 4) {
      newErrors.resetPassword = 'Password must be at least 4 characters';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (resetPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (await validate()) {
      setSuccessMessage('Password reset successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg max-w-md w-full">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Reset Password</h2>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <Input
            id="name"
            type="text"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            fullWidth
            error={errors.name}
          />
        </div>

        <div className="mb-4">
          <Input
            id="resetPassword"
            type="password"
            label="New Password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            placeholder="Enter new password"
            fullWidth
            error={errors.resetPassword}
          />
        </div>

        <div className="mb-6">
          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            fullWidth
            error={errors.confirmPassword}
          />
        </div>

        <div className="flex space-x-3">
          <Button type="button" variant="outline" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            Reset Password
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordForm;
