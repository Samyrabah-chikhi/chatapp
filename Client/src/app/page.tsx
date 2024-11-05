"use client";

import { FormEventHandler, useState } from "react";
import { useRouter } from "next/navigation";
import Login from "./components/Login";
import Register from "./components/Register";

export default function page() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [login, setLogin] = useState(true);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    const res = await fetch("http://localhost:4000/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      router.push("/profile");
    } else {
      alert("Can't login");
    }
  };
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    const res = await fetch("http://localhost:4000/register", {
      method: "POST",
      headers: {
        "content-type": "application/JSON",
      },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      router.push("/profile");
    } else {
      alert("problem with registration");
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
