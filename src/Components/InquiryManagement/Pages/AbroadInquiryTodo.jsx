import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, TextField, Button, Checkbox, Chip, Divider, Tooltip, FormControl,
  InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Clear as ClearIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  PriorityHigh as PriorityHighIcon,
  Flag as FlagIcon,
  LowPriority as LowPriorityIcon
} from '@mui/icons-material';

// Priority options
const priorities = [
  { value: 'high', label: 'High', color: 'error' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'low', label: 'Low', color: 'info' },
];

// Sample initial todos
const initialTodos = [
  { id: 1, text: 'Review new inquiries', completed: false, priority: 'high', dueDate: '2025-09-10' },
  { id: 2, text: 'Follow up with pending applications', completed: false, priority: 'medium', dueDate: '2025-09-08' },
  { id: 3, text: 'Update student records', completed: true, priority: 'low', dueDate: '2025-09-05' },
];

const AbroadInquiryTodo = () => {
  // State
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem('abroadInquiryTodos');
    return savedTodos ? JSON.parse(savedTodos) : initialTodos;
  });
  const [inputText, setInputText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState(null);

  // Save todos to localStorage
  useEffect(() => {
    localStorage.setItem('abroadInquiryTodos', JSON.stringify(todos));
  }, [todos]);

  // Filter todos
  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    if (filter === 'high') return todo.priority === 'high' && !todo.completed;
    return true;
  });

  // Add new todo
  const addTodo = () => {
    if (!inputText.trim()) return;
    
    const newTodo = {
      id: Date.now(),
      text: inputText,
      completed: false,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      createdAt: new Date().toISOString()
    };

    setTodos([newTodo, ...todos]);
    setInputText('');
    setPriority('medium');
    setDueDate('');
  };

  // Toggle todo completion
  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  // Start editing
  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setPriority(todo.priority);
    setDueDate(todo.dueDate || '');
  };

  // Save edit
  const saveEdit = (id) => {
    if (!editText.trim()) return;
    
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, text: editText, priority, dueDate: dueDate || null }
        : todo
    ));
    
    setEditingId(null);
  };

  // Delete todo
  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // Clear completed
  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <PriorityHighIcon color="error" fontSize="small" />;
      case 'medium': return <FlagIcon color="warning" fontSize="small" />;
      case 'low': return <LowPriorityIcon color="info" fontSize="small" />;
      default: return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3, position: 'relative' }}>
        <Box sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          bgcolor: 'warning.light',
          color: 'warning.contrastText',
          px: 1.5,
          py: 0.5,
          borderRadius: 1,
          fontSize: '0.75rem',
          fontWeight: 'bold',
          zIndex: 1
        }}>
          UNDER MAINTENANCE
        </Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          <FlagIcon color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
          To Do List
        </Typography>
        
        {/* Add Todo Form */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Add a new task..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priority}
              label="Priority"
              onChange={(e) => setPriority(e.target.value)}
            >
              {priorities.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getPriorityIcon(p.value)}
                    {p.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={addTodo}
            disabled={!inputText.trim()}
          >
            Add
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label="All"
            onClick={() => setFilter('all')}
            color={filter === 'all' ? 'primary' : 'default'}
            variant={filter === 'all' ? 'filled' : 'outlined'}
          />
          <Chip
            label="Active"
            onClick={() => setFilter('active')}
            color={filter === 'active' ? 'primary' : 'default'}
            variant={filter === 'active' ? 'filled' : 'outlined'}
          />
          <Chip
            label="High Priority"
            onClick={() => setFilter('high')}
            color={filter === 'high' ? 'error' : 'default'}
            variant={filter === 'high' ? 'filled' : 'outlined'}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Button
            size="small"
            onClick={clearCompleted}
            disabled={!todos.some(todo => todo.completed)}
            startIcon={<ClearIcon />}
          >
            Clear Completed
          </Button>
        </Box>

        {/* Todo List */}
        <List>
          {filteredTodos.map((todo) => (
            <React.Fragment key={todo.id}>
              <ListItem
                sx={{
                  bgcolor: todo.completed ? 'action.hover' : 'background.paper',
                  mb: 1,
                  borderRadius: 1,
                }}
              >
                <Checkbox
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  color="primary"
                />
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      sx={{
                        textDecoration: todo.completed ? 'line-through' : 'none',
                        color: todo.completed ? 'text.secondary' : 'text.primary',
                      }}
                    >
                      {todo.text}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      {getPriorityIcon(todo.priority)}
                      {todo.dueDate && (
                        <Typography variant="caption" color="text.secondary">
                          Due: {new Date(todo.dueDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{ ml: 1 }}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => startEditing(todo)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => deleteTodo(todo.id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default AbroadInquiryTodo;
