import React from "react";
import { Button } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

export default function Navbar({contactName}) {
        // Placeholder for the name of the person you're chatting with

     const handleLogout = () => {
        sessionStorage.removeItem("jwt");
        sessionStorage.removeItem("user_id");
        window.location.href = "/login"; // Redirect to login page after logout
     }

     return(
        <nav className="navbar bg-light px-4">
      <div className="d-flex justify-content-between w-100 align-items-center">
        {/* Left: Chat partner's name */}
        <h5 className="mb-0">{contactName}</h5>

        {/* Right: Logout button */}
        <Button variant="outline-danger" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </nav>
     );
}
