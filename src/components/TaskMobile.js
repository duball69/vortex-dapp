import React from "react";
import "./TaskMobile.css"; // Ensure you have a corresponding CSS file

const tasks = [
  {
    id: 1,
    description: "Join our Telegram Group",
    points: 10,
    category: "Social",
    link: "https://t.me/vortexdapp", // Use full URL for external link
  },
  {
    id: 2,
    description: "Follow our Twitter",
    points: 10,
    category: "Social",
    link: "https://twitter.com/vortexdapp", // Use full URL for external link
  },
  {
    id: 3,
    description: "Stake ETH on Vortex Pool",
    points: "1 point per $ staked",
    category: "Stake",
    link: "/staking", // Internal link
  },

  {
    id: 4,
    description: "Launch a token",
    points: 10,
    category: "Token",
    link: "/factory", // Link for this task
  },
  {
    id: 13,
    description: "Trade tokens",
    points: "1 point per $ traded",
    category: "Trade",
    link: "/tokens", // Link for this task
  },
  {
    id: 5,
    description: "Hit a market cap of 10,000",
    points: 20,
    category: "Market Cap",
    link: "/factory", // Link for this task
  },
  {
    id: 6,
    description: "Hit a market cap of 30,000",
    points: 40,
    category: "Market Cap",
    link: "/factory", // Link for this task
  },
  {
    id: 7,
    description: "Hit a market cap of 50,000",
    points: 50,
    category: "Market Cap",
    link: "/factory", // Link for this task
  },
  {
    id: 8,
    description: "Hit a market cap of 100,000",
    points: 100,
    category: "Market Cap",
    link: "/factory", // Link for this task
  },
  {
    id: 9,
    description: "Hit a market cap of 250,000",
    points: 200,
    category: "Market Cap",
    link: "/factory", // Link for this task
  },
  {
    id: 10,
    description: "Hit a market cap of 500,000",
    points: 500,
    category: "Market Cap",
    link: "/factory", // Link for this task
  },
  {
    id: 11,
    description: "Hit a market cap of 1 million",
    points: 800,
    category: "Market Cap",
    link: "/factory", // Link for this task
  },
  {
    id: 12,
    description: "Hit a market cap of 5 million",
    points: 1000,
    category: "Market Cap",
    link: "/factory", // Link for this task
  },
];

function TaskMobile() {
  const handleTaskButtonClick = (link) => {
    if (link.startsWith("http")) {
      window.open(link, "_blank"); // Open external link in a new tab
    } else {
      window.location.href = link; // Navigate to internal link
    }
  };

  return (
    <div className="tasks-container">
      <h3 className="deployedtaskstitle">Tasks to Earn Points on Vortex</h3>
      <h5 className="subtitletasks">
        Complete our quests to earn points convertible in token airdrop and
        weekly jackpots!
      </h5>
      <div className="tasks-grid">
        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            <h4 className="task-description">{task.description}</h4>
            <p className="task-points">Points: {task.points}</p>
            <p className="task-category">Category: {task.category}</p>
            <button
              className="task-button"
              onClick={() => handleTaskButtonClick(task.link)}
            >
              Start
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskMobile;
