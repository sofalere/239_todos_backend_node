# Todo List Application

This is the JS239 Project Assessment submission for Sofia Alere: a Todo List application built using JavaScript and Handlebars and a client-server architecture. It allows users to manage their tasks by adding, updating, deleting, and marking tasks as completed.

## Installation
1. Be sure to have node version` > 9.0  <= LTS Dubnium (v10.24.1)` and `npm` properly set up 
2. Place the entire directory into the `239_todos_backend_node` directory
3. Run `npm install` 
4. Start the server run `npm start`
4. Open the application in a web-browser at `http://localhost:3000/` 

## Usage
- By default, all todos are displayed. 
- You can click on the group names `All Todos` and `Completed` in the sidebar to filter the todos by group.
- If a group has subgroups (e.g., todos by date), you can click on a subgroup to filter the todos further.
- To add a new todo, click the "Add Todo" button. A modal will appear where you can enter the details of the new todo.
- To exit a modal, click anywhere on the page or in appropritate situations `Save` and `Mark as Completed`.
- To update an existing todo, click on its title in the todo list. The modal will appear with the todo's current details pre-filled. Modify the details as desired and click "Save" to update the todo.
- To delete a todo, click the "Delete" button next to the todo in the list.
- To mark a todo as completed, click anywhere on the todo except the title or delete button. Or if the modal with the todos details is open, select the 'Mark as Complete' button. The todo will be marked as completed and moved to the "Completed" group.

## Code Structure
The application consists of the following classes:

- View: Responsible for rendering the UI, binding user events, and communicating with the Manager class.
- Database: Handles communication with the server.
- Todo: Represents a single todo item with its properties and methods.
- TodoManager: Manages the internal storage of todos, creates and updates todo groups and the selected todo group.
- Controller: Orchestrates the interaction between the View, Database, and TodoManager classes and ensures that data being sent to those classes is formatted appropriately.

## Design Choices
I chose to keep in-line comments to a minimum. 

The Todo List application is created using a quasi MVC design pattern. I say near because there is intentional interdependencies among the classes. For example the `Controller` keeps track of the `currentTodo` state because though the `currentTodo` informs the `View`,  (e.g., line 138) the properties value is frequently used by the `Controller` itself (e.g., line 445, 458, etc). The `View` class is responsible for rendering the UI, binding user interactions, and handling simple form validation. It communicates with the `Controller` class to access handlers that will be invoked based on user input or data changes. The event handlers are placed in the `Controller` class because the interactions caused by events are with the `Database` and `TodoManager`. The `Database` class contains methods for fetching/ retrieving resources from the API. The `TodoManager` class keeps an internal storage of the todos and tracks the various groups as well as the currently selected group. The `Controller` implements all the event handlers and interfaces with the `Database` and `TodoManager` classes to ensure the correct data is sent to the `Database` and to the `View`.

To ensure the accurate rendering of groups and their corresponding numbers, I dynamically update the groups template whenever a change is made to a todo. This approach guarantees the consistent and up-to-date representation of groups, even during frequent updates such as completing or incompleting todos. Whenever a change is completed in the `Database`, the `resolve` function triggers the `TodoManager.update()` method. This method not only updates the object referenced by the `TodoManager.todoObjects` proeprty but also invokes `TodoManager.createGroups()`. By utilizing the `TodoManager.todoObjects property`, the `createGroups()` function generates new groups and assigns them to the `TodoManager.groups` property. By doing this I ensure that any time the `Controller.getGroups()` method is invoked the most recent changes are visible.

In structuring the groups I chose to design the `TodoManager.groups` object property to fit the expectations of the Handlebars template in the view, where they would eventually be used. This is because the `groups` property does not serve any other purpose within the code. There was also no need to structure each indiviudal todo in a Handlebars compliant way since all the todos in all the groups would never be rednered at once. Instead, I opted to format only the todos that are currently being displayed, leaving the responsibility of formatting to the Controller class

## Assessment Requirements with Implementation Line \#s and Explanations
*Note that the Class names are just for clarity, they are all in the same `todos.js` file.*


1. When the user clicks on "Add new to do," the modal is displayed. (`View-84`)

2. The header displays the currently selected "todo group" along with the corresponding count of todos. (`View-36`, `Controller-380`)

   - The header is dynamically updated each time the todo list is re-rendered. The `Controller.getHeader()` method determines the currently selected group and returns the appropriate title. The count of todos is calculated by counting the selected todos.

3. Hovering over a todo item highlights it. (`style.css-185`)

4. Clicking on the area surrounding the todo name toggles the todo state between complete and not complete. (`View-126`, `Controller-470`, `Database-218`, `TodoManager-288`)

   - The `Controller.toggleCompletedHandler()` method interacts with the `TodoManager` to determine the current state of the todo, flips its state, and instructs the `Database` to update the corresponding value. Once the Database completes the update, the TodoManager is notified of the change, and the View displays the updated changes.

5. The todo name displayed on the todo list follows the format "{title} - {month}/{year}" (e.g., "Item 1 - 02/15"). (`index.html-146`, `Todo-249`)

6. If a todo does not have both a month and year, the todo name displayed is in the format "{title} - No Due Date" (e.g., "Item 3 - No Due Date"). (`Todo-256`)

7. Hovering over the todo name highlights the text. (`index.html-217`)

8. Clicking on a todo name shows the modal with the corresponding todo details. (`View-93`, `Controller-442`, `TodoManager-321`)

   - The `View.bindOpenUpdateTodoModal()` method retrieves the ID from the event and passes it to the `Controller.retrieveTodoForUpdateHandler()` method. This method further calls `TodoManager.findTodo()` to retrieve the desired todo. The `Controller.currentTodo` property is updated with the returned todo object. Then, `View.renderModal()` is invoked with the todo as an argument. If a todo is supplied, `View.renderModal()` fills out the input fields of the form with the todo information.

9. Hovering over the trash bin area highlights it. (`index.html-194`)

10. Clicking on the trash bin or its surrounding area deletes the todo both on the server and in the browser. (`View 103`, `Controller-432`, `Database-228`, `TodoManager-309`)

   - The `Controller.deleteTodoHandler()` method invokes the `Database.deleteTodo()` method to remove the todo with a specific ID from the database. Once the deletion is successful, the `TodoManager`'s internal storage is updated to reflect the change, and the `View` renders the new todos and groups.

11. Toggling or deleting a todo should not change the currently selected todo group.

   - Neither the update nor the delete operations invoke the `TodoManager.setSelected()` method, which is the only way to change the currently selected group.

12. The todos in the main area should reflect the currently selected group. (`View-23`, `Controller-362, 358`)

   - The `TodoManager.setSelected()` method checks the current value of the `TodoManager.selected` property and retrieves the corresponding value from `TodoManager.groups`. These todos are then passed to `Controller.formatForView()`. The `Controller.formatForView()` method returns the currently selected todo in a format compatible with the Handlebars template.

13. Completed todos should appear at the bottom of the list. (`Controller-408`)

14. The navigation area displays all available "todo groups." (`View-29`, `Controller-376`, `TodoManager-270`)

   - The `Controller.getGroups()` method is called by the view whenever the groups are rendered. It returns the current value of the `TodoManager.groups` property, which is updated by the `TodoManager.createGroups()` method whenever a change is made to any todo, ensuring that the property value is up to date.

15. The corresponding count of "todo items" is displayed for each "todo group." (`index.html 158, 166, 174, 182`)

16. Clicking on a "todo group" selects it and updates the content in the main area accordingly. (`View-146`, `TodoManager-283`)

   - The `View.bindSelectGroup()` method retrieves the desired `group` and `date `values and passes them to the `Controller.selectGroupHandler()` method. This method invokes the `TodoManager.setSelected()` function to update the value of `TodoManager.selected`. The updated value is then used by the `View.renderTodos()` method to display the changes.

17. Clicking "Save" saves the information and closes the modal. (`View-111`, `Controller-422, 454`, `Database-209, 218`, `TodoManager-288`)

   - The `View.bindSaveModal()` method checks if the `Controller.currentTodo` property has a value. If it does, the `Controller.updateTodoHandler()` method is invoked; otherwise, the `Controller.addTodoHandler()` method is invoked. Both methods send the data to the database, update the internal storage, and adjust the user display accordingly. Finally, the modal is closed.

18. When adding a new item, the "All Todos" group is automatically selected in the navigation area. (`TodoManager-304`)

   - After a new todo is added to the database, the `TodoManager.update()` function is invoked with the string "add" as an argument. The `TodoManager` internally calls its `add()` method with this string and further invokes its `setSelected()` function with the argument `"todos"`. This change in the `TodoManager.selected` property is reflected when the `View.renderTodos()` is invoked.

19. When clicking on an existing item, it retains the currently selected group.

   - Clicking anywhere except the sidebar group titles (and some specific events like the `Save` and `Mark as Complete` button) does not invoke the `setSelected()` method, which is the only way to change the currently selected group, so clicking an existing item will retain the selected group.

20. Clicking "Mark As Complete" alerts the user that it cannot be done for a new item, and marks the todo as completed for an existing item. (`View-136`)

   - The `View.bindMarkComplete()` method checks if the `Controller.currentTodo` property has a value. If it does not, it alerts the user. If it does, the `Controller.toggleCompletedHandler()` method is invoked with the second argument set to `true` to indicate marking the state as complete instead of toggling.

21. Clicking anywhere outside the modal closes it. (`View-71`)

   - If a click event occurs somewhere outside the modal while it is open, the `View.hideModal()` method is invoked.

#### Assumptions
1. Todos in the sidebar are sorted from the soonest to the latest based on their date. (TodoManager-270, 327)

  - Whenever the groups are rendered, the `TodoManager.createGroups()` method is called, which internally utilizes the `todosByDate()` method to create and sort the date-based todo groups.

2. The todos page is prevented from refreshing if no changes were made when clicking the `"Save"` button during an update of a todo. `(Controller-450)`

  - The `Database.updateTodo()` method and subsequent storage updates and renderings are only triggered if there are actual changes made to the todo.
