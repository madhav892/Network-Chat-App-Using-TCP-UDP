import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Send, User, Mail, Moon, Sun } from 'lucide-react';
import * as THREE from 'three';
import { Toaster, toast } from 'react-hot-toast';

const socket = io('https://chat-app-using-socket-and-tcp-udp-port.vercel.app', {
  transports: ['websocket']
});

export default function Component() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [registered, setRegistered] = useState(false);
  const [users, setUsers] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    socket.on('receive_message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on('user_list', (userList) => {
      setUsers(userList);
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_list');
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
      renderer.setSize(200, 200);

      const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
      const material = new THREE.MeshNormalMaterial();
      const torusKnot = new THREE.Mesh(geometry, material);
      scene.add(torusKnot);

      camera.position.z = 4;

      const animate = () => {
        requestAnimationFrame(animate);
        torusKnot.rotation.x += 0.01;
        torusKnot.rotation.y += 0.01;
        renderer.render(scene, camera);
      };

      animate();

      return () => {
        renderer.dispose();
      };
    }
  }, [canvasRef]);

  const registerUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('https://chat-app-using-socket-and-tcp-udp-port.vercel.app/register', {
        username,
        email,
      });
      setRegistered(true);
      socket.emit('new_user', username);
      toast.success('Registration successful!');
    } catch (error) {
      toast.error('Error registering user');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessage = {
        sender: username,
        content: message,
        timestamp: new Date().toISOString(),
      };
      socket.emit('send_message', newMessage);
      setMessage('');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
      <Toaster />
      {!registered ? (
        <div className={`w-full max-w-md m-auto ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-2xl py-10 px-16`}>
          <h1 className={`text-3xl font-bold text-center ${darkMode ? 'text-white' : 'text-gray-800'} mb-8`}>Welcome to ChatSphere</h1>
          <canvas ref={canvasRef} className="mx-auto mb-8" width={200} height={200} />
          {loading ? (
            <div className="flex justify-center items-center">
              <div className="loader"></div>
            </div>
          ) : (
            <form onSubmit={registerUser} className="space-y-6">
              <div className="space-y-4">
                <div className={`flex items-center border-2 py-2 px-3 rounded-2xl ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <User className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    className={`pl-2 outline-none border-none w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className={`flex items-center border-2 py-2 px-3 rounded-2xl ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <Mail className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    className={`pl-2 outline-none border-none w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 py-2 text-white rounded-2xl hover:bg-blue-700 transition-colors text-lg font-semibold"
              >
                Join ChatSphere
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl m-4 rounded-lg overflow-hidden`}>
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-800'} text-white p-4 flex justify-between items-center`}>
            <h1 className="text-2xl font-bold">ChatSphere</h1>
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex-1 flex overflow-hidden">
            <div className={`w-64 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} border-r flex flex-col`}>
              <div className={`p-4 border-b ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-200'}`}>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>Online Users</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {users.map((user, index) => (
                  <div key={index} className={`flex items-center mb-2 ${darkMode ? 'bg-gray-600' : 'bg-white'} p-2 rounded-lg shadow`}>
                    <User className="h-5 w-5 mr-2 text-blue-500" />
                    <span className={darkMode ? 'text-white' : 'text-gray-700'}>{user}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.sender === username ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg shadow ${
                        msg.sender === username
                          ? 'bg-blue-500 text-white'
                          : darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'
                      }`}
                    >
                      <p className="font-semibold">{msg.sender}</p>
                      <p>{msg.content}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className={`${darkMode ? 'bg-gray-900' : 'bg-white'} p-4 border-t flex`}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className={`flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'
                  }`}
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}