import React from "react";
import Header2 from "../components/Header2.js";
import Footer from "../components/Footer.js";
import TasksList from "../components/TasksList.js"; // Import the TasksList component
import TaskMobile from "../components/TaskMobile.js";
import "./Task.css"; // Import the CSS file for Task page

function TaskPage() {
  return (
    <div>
      <Header2 />
      <div className="token-list-desktop">
        {" "}
        {/* Added container for tasks */}
        <TasksList /> {/* Render the TasksList component */}
      </div>
      <div className="token-list-mobile">
        {" "}
        {/* Added container for tasks */}
        <TaskMobile /> {/* Render the TasksMobile component */}
      </div>
      <Footer />
    </div>
  );
}

export default TaskPage;
