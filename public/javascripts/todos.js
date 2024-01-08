class View {
  constructor(controller) {
    this.controller = controller;
    this.registerPartials();
    this.renderTodos();
    this.renderGroups();
    this.bindEvents();
  }

  registerPartials() {
    const partials = [
      'all_todos_template',
      'completed_todos_template',
      'by_date_template',
      'completed_by_date_template',
      'item_partial'
    ];
    partials.forEach(partial => {
      Handlebars.registerPartial(partial, $(`#${partial}`).html());
    });
  }

  renderTodos() {
    const todos = this.controller.getSelected();
    this.renderHeader(todos);

    const template = Handlebars.compile($('#list_template').html());
    $('tbody').html(template(todos));
  }

  renderGroups() {
    const template = Handlebars.compile($('#sidebar_template').html());
    $('#sidebar').html(template(this.controller.getGroups()));
  }

  renderHeader(todos) {
    const amount = (todos) ? todos['selected'].length : 0;
    const template = Handlebars.compile($('#header_template').html());
    $('#header').html(template({title: this.controller.getHeader(),count: amount}));
  }

  renderModal(todo) {
    if (todo) {
      const { title, day, month, year, description } = todo;
      $('#title').val(title);
      $('#day').val(day);
      $('#month').val(month);
      $('#year').val(year);
      $('textarea', '#modal-form').val(description);
    }

      $('#modal-form').fadeIn();
  }

  hideModal() {
    this.controller.currentTodo = null;
    $('#modal-form')[0].reset();
    $('#modal-form').fadeOut();
  }

  bindEvents() {
    this.bindDeleteTodo();  
    this.bindUpdateModal();
    this.bindOpenAddTodoModal();
    this.bindSaveModal();
    this.bindToggleCompleted();
    this.bindMarkCompleted();
    this.bindSelectGroup();
  }

  bindUpdateModal() {
    document.addEventListener('click', e => {
      if (e.target.classList.contains('item_name')) {
        e.preventDefault();
        const id = e.target.parentNode.firstElementChild.id;
        this.controller.retrieveTodoForUpdateHandler(id);
      } else if (!$(event.target).closest('#modal-form').length &&
        $('#modal-form').is(":visible")) {
          this.hideModal();
      }
    })
  }

  bindOpenAddTodoModal() {
    $('#add_todo').on('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.hideModal();
      this.renderModal();
    })
  }

  bindOpenUpdateTodoModal() {
    $('tbody').on('click', e => {
      if (e.target.classList.contains('item_name')) {
        e.preventDefault();
        const id = e.target.parentNode.firstElementChild.id;
        this.controller.retrieveTodoForUpdateHandler(id);
      }
    });
  }

  bindDeleteTodo() {
    $('tbody').on('click', '.delete', e => {
      e.stopPropagation();
      const id = $(e.target).closest('tr').attr('data-id');
      this.controller.deleteTodoHandler(id);
    })
  }

  bindSaveModal() {
    $('#modal-form').on('submit', e => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      if (this.validateForm(data)) {
        if (this.controller.currentTodo) {
          this.controller.updateTodoHandler(data);
        } else {
          this.controller.addTodoHandler(data);
        }
        this.hideModal();
      }
    })
  }

  bindToggleCompleted() {
    $('#todo_list').on('click', e => {
      if (!e.target.classList.contains('item_name') && 
          !e.target.classList.contains('delete')) {
        const id = $(e.target).closest('tr').attr('data-id');
        this.controller.toggleCompletedHandler(id);
      }
    })
  }

  bindMarkCompleted() {
    $('button').on('click', e => {
      if (this.controller.currentTodo) {
        this.controller.toggleCompletedHandler(null, true);
      } else {
        alert('Cannot mark as complete as item has not been created yet!');
      }
    });
  }

  bindSelectGroup() {
    $('#sidebar').on('click', e => {
      const element = $(e.target).closest('.group_select')[0];
      if (element) {
          let group;
          let date;
          if (element.tagName === 'DIV') {
            group = element.id;
          } else if (element.tagName === 'DL') {
            group = element.parentElement.id;
            date = element.getAttribute('data-title');
          }
          this.controller.selectGroupHandler(group, date);
      }
    });
  }

  validateForm(data) {
    const titleInput = data.get('title');
    const descriptionInput = data.get('description');
    const title = titleInput.trim();
    const description = descriptionInput.trim();

    if (title.length < 3) {
      alert("You must enter a title at least 3 characters long.");
      return;
    }
    if (title.length > 25) {
      alert('Title must be less than 25 characters long.');
      return;
    }
    if (description.length > 200) {
      alert('Description cannot exceed 200 characters.');
      return;
    }
    return true;
  }
}

class Database {
  constructor(reject) { 
    this.reject = reject || function() {};
  }

  sendRequest = async function(path, options) {
    try {
      const response = await fetch("http://localhost:3000/" + path, options);
      let jsonData;
      if (options && options.method === 'DELETE') {
        jsonData = await response.text();
      } else {
        jsonData = await response.json();
      }
      return jsonData;
    } catch(error) {
      this.reject(error);
    }
  }

  getAll() {
    return this.sendRequest("api/todos");
  }

  saveTodo(todo) {
    const options = { 
      method: "POST", 
      headers: { "Content-Type": "application/json", }, 
      body: JSON.stringify(todo),
    };
    return this.sendRequest("api/todos", options);
  }

  updateTodo(newData, id) {
    const url = `api/todos/${id}`
    const options = { 
      method: "PUT", 
      headers: { "Content-Type": "application/json", }, 
      body: JSON.stringify(newData),
    };
    return this.sendRequest(url, options);
  }

  deleteTodo(id) {
    const url = 'api/todos/' + id;
    const options = {method: 'DELETE'};
    return this.sendRequest(url, options);
  }

  resetDatabase() {
    return this.sendRequest('api/reset').then(resolve => console.log(resolve));
  }
}

class Todo {
  constructor(data) {
    const { id, title, day, month, year, completed, description } = data;
    this.id = id;
    this.title = title;
    this.day = (day === '00') ? 'Day' : day;
    this.month = (month === '00') ? 'Month' : month;
    this.year = (year === '0000') ? 'Year' : year;
    this.completed = completed;
    this.description = description;
    this.dueDate = this.getDueDate();
  }

  getDueDate() {
    if (this.month && this.year && this.month !== 'Month' && this.year !== 'Year') {
      return `${this.month}/${this.year.slice(2)}`;
    } else {
      return 'No Due Date';
    }
  }
}

class TodoManager {
  constructor(todos) {
    this.todoObjects = todos.map(info => new Todo(info));
    this.selected = ['todos'];
    this.createGroups();
    return this;
  }
  
  // creates and returns groups based on contents of todoObjects
  createGroups() {
    const todos = this.todoObjects;
    const done = this.todoObjects.filter(todo => !!todo.completed);
    const todos_by_date = this.todosByDate(todos);
    const done_todos_by_date = this.todosByDate(done);
    this.groups = { 
      todos,
      done,
      todos_by_date,
      done_todos_by_date,
    };
  }

  setSelected(group, date) {
    this.selected = (date) ? [group, date] : [group];
  }

  // updates the todoObjects array
  update(operation, data) {
    switch(operation) {
      case ('replace'):
        this.replace(data);
        break;
      case ('add'):
        this.add(data);
        break;
      case ('delete'):
        this.delete(data);
        break;
    }

    this.createGroups();
  }

  add(todo) {
    this.todoObjects.push(todo);
    this.setSelected('todos');
  }

  delete(id) {
    const idx = this.todoObjects.findIndex(obj => obj.id === id);
    this.todoObjects.splice(idx, 1);
  }

  replace(todo) {
    let idx = this.todoObjects.findIndex(obj => obj.id === todo.id);
    if (idx !== -1) {
      this.todoObjects.splice(idx, 1, todo)
    }
  }

  findTodo(id) {
    id = Number.parseInt(id, 10);
    return this.todoObjects.filter(todo => todo.id === id)[0];
  }

  // returns the date groups sorted from soonest to latest
  todosByDate(list) {
    let results = {};
    list.forEach(todo => {
      const date = todo.dueDate;
      if (!results[date]) {
        results[date] = [];
      }
      results[date].push(todo);
    })

    let keys = Object.keys(results).sort((a, b) => this.stringToDate(a) - this.stringToDate(b));
    let sortedResults = {};

    keys.forEach(key => sortedResults[key] = results[key]);
    return sortedResults;
  }

  stringToDate(string) {
    const date = (string === 'No Due Date') ? ['00', '1700'] : string.split('/');
    return new Date(date[1], date[0]);
  }
}

class Controller {
  constructor() {
    this.currentTodo = null;
    this.db = new Database(this.alertError);

    this.db.getAll().then(todos => {
      this.todoManager = new TodoManager(todos);
      this.view = new View(this);
    });
  }

  // returns currently selected todods in a view friendly format
  getSelected() {
    const [group, date] = this.todoManager.selected;
    let todos = this.todoManager.groups[group];
    if (date) {
      todos = todos[date];
    }
    if (todos) {
      if (!Array.isArray(todos)) {
        todos = [todos];
      }
      return this.formatForView(todos);
    }
  }

  getGroups() {
    return this.todoManager.groups;
  }

  getHeader() {
    const [group, dateGroup] = this.todoManager.selected;
    if (group === 'todos') {
      return 'Tasks';
    } else if (group === 'done') {
      return 'Completed';
    } else {
      return dateGroup;
    }
  }

  //an error handler passed to the database
  alertError(error) {
    const errorMessage = "Sorry, there was an error with your request";
    console.log(errorMessage, error);
    alert(errorMessage);
  }

  formatForServer(formData) {
    const object = {};
    for (const [key, val] of formData.entries()) {
      if (['Day', 'Month'].includes(val)) {
        object[key] = '00';
      } else if (val === 'Year') {
        object[key] = '0000'
      } else {
        object[key] = val;
      }
    }
    return object;
  }

  formatForView(todos) {
    const incomplete = todos.filter(todo => !todo.completed);
    const complete = todos.filter(todo => todo.completed);
    todos = [...incomplete, ...complete];
    return {
      selected: todos.map(todo => ({ 
                id: todo.id, 
                title: todo.title,
                due_date: todo.dueDate,
                completed: todo.completed,
          }))
    };
  }

  addTodoHandler(formData) {
    const todo = this.formatForServer(formData);
    this.db.saveTodo(todo)
      .then(response => {
        this.todoManager.update('add', new Todo(response))
        console.log(response);
        this.view.renderTodos();
        this.view.renderGroups();
      });
  }

  deleteTodoHandler(id) {
    this.db.deleteTodo(id)
      .then(response => {
        id = Number.parseInt(id, 10);
        this.todoManager.update('delete', id)
        this.view.renderTodos();
        this.view.renderGroups();
      });
  }

  retrieveTodoForUpdateHandler(id) {
    id = Number.parseInt(id.replace(/[^0-9]/g, ''), 10);
    const todo = this.todoManager.findTodo(id);
    this.currentTodo = todo;
    this.view.renderModal(todo);
  }

  //checks if user input during a todo update made any changes
  changeMade(input) {
    return Object.keys(input).some(key => this.currentTodo[key] !== input[key]);
  }

  updateTodoHandler(formData) {
    const newInfo = this.formatForServer(formData);

    if (true) {
      this.db.updateTodo(newInfo, this.currentTodo.id)
        .then(response => {
          const todo = new Todo(response);
          this.todoManager.update('replace', todo);
          this.view.hideModal();
          this.view.renderTodos();
          this.view.renderGroups();
        });
      }
  }

  //if `markCompleted` then does not check current state, only toggles to `completed`
  toggleCompletedHandler(id, markComplete) {
    let flippedState;
    if (markComplete) {
      flippedState = true;
      id = this.currentTodo.id;
    } else {
      flippedState = !this.todoManager.findTodo(id).completed;
    }
    const newInfo = { completed: flippedState };

    this.db.updateTodo(newInfo, id)
      .then(response => {
        const todo = new Todo(response);
        this.todoManager.update('replace', todo);
        this.view.hideModal();
        this.view.renderTodos();
        this.view.renderGroups();
      });
  }

  selectGroupHandler(group, date) {
    this.todoManager.setSelected(group, date);
    this.view.renderTodos();
  }
}

$( document ).ready(function() {
  new Controller();
});