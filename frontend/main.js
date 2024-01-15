// deno-lint-ignore-file
function debounce(func, wait = 750) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

function app() {
  return {
    description: "",
    auth: "unauthorized",
    tasks: [],
    stats: {},
    getAll() {
      api("/api/tasks", "GET").then((response) => {
        const [resp, headers] = response;
        this.auth = headers.get("x-user") || "unauthorized";
        this.tasks = resp.tasks;
        this.stats = resp.stats;
      });
    },
    addNewTask(description) {
      const confirmed = confirm("Are you sure?");

      if (!confirmed) {
        return;
      }

      api("/api/tasks", "POST", { description }).then(() => {
        this.getAll();
      });
    },
    archive(task) {
      const confirmed = confirm("Are you sure you want to archive this task?");

      if (!confirmed) {
        return;
      }

      api(`/api/tasks/${task}`, "DELETE", {}).then(() => {
        this.getAll();
      });
    },
    markTaskAsCompletedTask(task) {
      const confirmed = confirm(
        "Are you sure you want to mark this task as completed?",
      );

      if (!confirmed) {
        return;
      }

      api(`/api/tasks/${task}/complete`, "PUT", {}).then(() => {
        return this.getAll();
      });
    },
    voteForTask(task) {
      api(`/api/tasks/${task}/vote`, "PUT", {}).then(() => {
        return this.getAll();
      });
    },
    unassignFromTask(task) {
      const confirmed = confirm(
        "Are you sure you want to unassign yourself from this task?",
      );

      if (!confirmed) {
        return;
      }

      api(`/api/tasks/${task}/unassign`, "DELETE", {}).then(() => {
        return this.getAll();
      });
    },
    assignNextTaskToMe() {
      api("/api/tasks/assign", "GET").then(() => {
        return this.getAll();
      });
    },
  };
}

async function api(url, method, data) {
  const response = await fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    alert(await response.text());
    return null;
  }

  if (response.headers.get("Content-Type") === "application/json") {
    const resp = await response.json();
    return [resp, response.headers];
  } else if (response.headers.get("Content-Type") === "text/plain") {
    const resp = response.text();
    return [resp, response.headers];
  } else {
    return null;
  }
}

function date(date) {
  return new Date(date).toLocaleString();
}

function copy(text) {
  navigator.clipboard.writeText(text);
  alert("Copied the text: " + text);
}

function seconds(diffTime) {
  return Math.floor(diffTime / 1000);
}

function diff(from, to) {
  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();
  const diffTime = toTime - fromTime;
  return diffTime;
}

function duration(durationInSeconds) {
  const days = Math.floor(durationInSeconds / (24 * 3600));
  const hours = Math.floor((durationInSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = durationInSeconds % 60;

  const parts = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (seconds > 0) {
    parts.push(`${seconds}s`);
  }

  if (parts.length === 0) {
    return "0s";
  }

  return parts.join(" ");
}

function timeAgo(date) {
  if (!date) {
    return "never";
  }

  const currentDate = new Date();
  const timestamp = date instanceof Date
    ? date.getTime()
    : new Date(date).getTime();
  const timeDiff = currentDate.getTime() - timestamp;

  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return `${seconds} seconds ago`;
  } else if (minutes < 60) {
    return `${minutes} minutes ago`;
  } else if (hours < 24) {
    return `${hours} hours ago`;
  } else if (days < 7) {
    return `${days} days ago`;
  } else if (weeks === 1) {
    return "last week";
  } else if (months < 12) {
    return `${months + 1} months ago`;
  } else if (years === 1) {
    return "last year";
  } else {
    return `${years} years ago`;
  }
}
