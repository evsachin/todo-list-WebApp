import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Check, Trash, Pencil, Upload, Download } from "lucide-react";

export default function TodoApp() {
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem("todos");
    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  const [task, setTask] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (task.trim() === "") return;
    const newTodos = [
      ...todos,
      { id: Date.now().toString(), text: task, completed: false },
    ];
    setTodos(newTodos);
    setTask("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") addTodo();
  };

  const toggleComplete = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const startEditing = (id, text) => {
    setEditingId(id);
    setEditingText(text);
  };

  const updateTodo = (id) => {
    if (editingText.trim() === "") return;
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, text: editingText } : todo
      )
    );
    setEditingId(null);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reorderedTodos = Array.from(todos);
    const [movedItem] = reorderedTodos.splice(result.source.index, 1);
    reorderedTodos.splice(result.destination.index, 0, movedItem);
    setTodos(reorderedTodos);
  };

  const exportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(todos));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "todos.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const exportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Task,Completed\n" +
      todos.map((todo) => `${todo.text},${todo.completed}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", encodedUri);
    downloadAnchorNode.setAttribute("download", "todos.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

 const importFile = (event) => {
   const file = event.target.files[0];
   if (!file) return;

   const reader = new FileReader();
   reader.onload = (e) => {
     try {
       const content = e.target.result;
       let newTodos = [];

       if (file.type === "application/json") {
         const parsed = JSON.parse(content);
         newTodos = parsed.map((todo) => ({
           ...todo,
           id: Date.now().toString() + Math.random(), // Ensure unique IDs
         }));
       } else if (file.type === "text/csv") {
         const lines = content.split("\n").slice(1);
         newTodos = lines
           .filter((line) => line)
           .map((line, index) => {
             const [text, completed] = line.split(",");
             return {
               id: (Date.now() + index).toString(),
               text: text.trim(),
               completed: completed.trim() === "true",
             };
           });
       }

       // Append new data **above** the existing todos
       setTodos((prevTodos) => [...newTodos, ...prevTodos]);
     } catch (error) {
       console.error("Error importing file", error);
     }
   };
   reader.readAsText(file);
 };


  return (
    <div className="max-w-md mx-auto mt-10 p-5 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold text-center mb-4">To-Do List</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter a task..."
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={addTodo}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>
      <div className="flex max-sm:flex-col gap-2 mt-4">
        <button
          onClick={exportJSON}
          className="flex-1 bg-green-500 text-white px-4 py-2 rounded"
        >
          Download JSON
        </button>
        <button
          onClick={exportCSV}
          className="bg-yellow-500 text-white px-4 py-2 rounded "
        >
          Download CSV
        </button>
        <input
          type="file"
          accept=".json,.csv"
          onChange={importFile}
          className="bg-gray-200 px-4 py-2 rounded cursor-pointer text-center w-full text-wrap"
        />
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="todos">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="mt-4"
            >
              {todos.map((todo, index) => (
                <Draggable key={todo.id} draggableId={todo.id} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="flex items-center justify-between p-2 border-b bg-gray-50 hover:bg-gray-100 transition rounded-md"
                    >
                      {editingId === todo.id ? (
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={() => updateTodo(todo.id)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && updateTodo(todo.id)
                          }
                          autoFocus
                          className="flex-1 p-1 border rounded"
                        />
                      ) : (
                        <span
                          onDoubleClick={() => startEditing(todo.id, todo.text)}
                          className={`flex-1 cursor-pointer ${
                            todo.completed ? "line-through text-gray-500" : ""
                          }`}
                        >
                          {todo.text}
                        </span>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleComplete(todo.id)}
                          className="p-1"
                        >
                          <Check className="text-green-500" />
                        </button>
                        <button
                          onClick={() => startEditing(todo.id, todo.text)}
                          className="p-1"
                        >
                          <Pencil className="text-blue-500" />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="p-1"
                        >
                          <Trash className="text-red-500" />
                        </button>
                      </div>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
