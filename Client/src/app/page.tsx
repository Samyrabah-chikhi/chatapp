"use client";

import { FormEventHandler, SetStateAction, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Login from "./components/Login";
import Register from "./components/Register";

export default function page() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [login, setLogin] = useState(true);

  const router = useRouter();

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setRequired: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const res = await fetch("http://localhost:4000/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const user = await res.json();
      router.push("/profile");
    } else {
      const response = await res.json();
      setRequired(true);
      setError(response.message);
    }
  };
  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>,
    setError: React.Dispatch<SetStateAction<string>>,
    setRequired: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const res = await fetch("http://localhost:4000/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/JSON",
      },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const user = await res.json();
      router.push("/profile");
    } else {
      const response = await res.json();
      setRequired(true);
      setError(response.message);
    }
  };

  return (
    <>
      {login && (
        <Login
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          login={login}
          setLogin={setLogin}
          handleLogin={handleLogin}
        />
      )}
      {!login && (
        <Register
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          passwordConfirm={passwordConfirm}
          setPasswordConfirm={setPasswordConfirm}
          login={login}
          setLogin={setLogin}
          handleRegister={handleRegister}
        />
      )}
    </>
  );
}
