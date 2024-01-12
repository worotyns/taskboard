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
    tasks: [],
    getAll() {
      api("/api/tasks", "GET").then((resp) => {
        this.tasks = resp.tasks;
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
    assignNextTaskToMe() {
      api("/api/tasks/assign", "GET").then(() => {
        return this.getAll();
      });
    },
  };
}

async function api(url, method, data) {
  
  console.log({url, method, data});

  const response = await fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json", "X-User": 'mati' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    alert(await response.text())
    return null;
  }

  if (response.headers.get("Content-Type") === "application/json") {
    const resp = await response.json();
    console.log({resp});
    return resp;  
  } else if (response.headers.get("Content-Type") === "text/plain") {
    const resp  = response.text();
    console.log({resp});
    return resp;
  } else {
    return null;
  }
}
