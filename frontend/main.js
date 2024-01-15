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
      api("/api/tasks", "POST", { description }).then(() => {
        this.getAll();
      });
    },
    archive(task) {
      api(`/api/tasks/${task}`, "DELETE", {}).then(() => {
        this.getAll();
      });
    },
    markTaskAsCompletedTask(task) {
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
      const confirmed = confirm("Are you sure you want to unassign yourself from this task?");
      
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
    alert(await response.text())
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
};
