import React, { SetStateAction, useState } from "react";

interface RegisterInterface {
  username: string;
  setUsername: React.Dispatch<SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<SetStateAction<string>>;
  passwordConfirm: string;
  setPasswordConfirm: React.Dispatch<SetStateAction<string>>;
  login: boolean;
  setLogin: React.Dispatch<SetStateAction<boolean>>;
  handleRegister: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

const Register = ({
  username,
  setUsername,
  password,
  setPassword,
  passwordConfirm,
  setPasswordConfirm,
  login,
  setLogin,
  handleRegister,
}: RegisterInterface) => {
  const [required, setRequired] = useState(false);
  const [error, setError] = useState("");
  const handleUser = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };
  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };
  const handlePasswordConfirm = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordConfirm(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      username.trim() != "" &&
      password.trim() != "" &&
      passwordConfirm.trim() != ""
    ) {
      if (password == passwordConfirm) {
        await handleRegister(e);
      } else {
        setRequired(true);
        setError("Passwords MUST match!");
      }
    } else {
      setRequired(true);
      setError("ALL fields are required!");
    }
  };

  return (
    <div className="flex items-center min-h-screen justify-evenly">
      <div className="form-div px-16 py-20 flex flex-col items-center rounded-md hover:scale-110 duration-1000">
        {required && (
          <h2 className="text-red-700 font-medium text-lg mb-2">{error}</h2>
        )}
        <form className="flex flex-col" action="submit" onSubmit={handleSubmit}>
          <input
            type="text"
            onChange={handleUser}
            value={username}
            placeholder="Username"
            className="mb-2 py-2 px-6 border border-black rounded-lg"
          />
          <input
            type="password"
            onChange={handlePassword}
            value={password}
            placeholder="Password"
            className="mb-2 py-2 px-6 border border-black rounded-lg"
          />
          <input
            type="password"
            onChange={handlePasswordConfirm}
            value={passwordConfirm}
            placeholder="Password"
            className="mb-2 py-2 px-6 border border-black rounded-lg"
          />
          <button className="login-btn mt-4 px-8 py-2 rounded-md hover:scale-105 duration-200">
            Register
          </button>
        </form>
        <hr className="bg-black w-full border-t-2 border-gray-700 mt-8" />
        <p className="mt-2 hover:text-gray-700 duration-200">
          Already have an account?
        </p>
        <button
          className="register-btn mt-4 px-8 py-2 rounded-md hover:scale-110 duration-200"
          onClick={(e) => setLogin(!login)}
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Register;
