import React from "react";
import toast from "react-hot-toast";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { createRoomApi, joinRoomApi } from "../services/RoomService";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router-dom";

const JoinCreateChat = () => {
  const [detail, setDetail] = React.useState({
    roomId: "",
    username: "",
  });

  const {
    roomId,
    currentUser,
    connected,
    setRoomId,
    setCurrentUser,
    setConnected,
  } = useChatContext();

  const navigate = useNavigate();

  function handleFormInputChange(event) {
    setDetail({
      ...detail,
      [event.target.name]: event.target.value,
    });
  }

  function validateForm() {
    if (detail.username.trim() === "" || detail.roomId.trim() === "") {
      toast.error("Please fill in all fields.");
      return false;
    }
    return true;
  }

  async function joinRoom() {
    if (validateForm()) {
      //join room logic
      try {
        const room = await joinRoomApi(detail.roomId);
        toast.success("joined..");
        setCurrentUser(detail.username);
        setRoomId(detail.roomId);
        setConnected(true);
        navigate(`/chat/${roomId}`, { state: { currentUser, roomId } });
        //forward to chat page...
      } catch (error) {
        if (error.status == 400) {
          toast.error(error.response.data);
        } else {
          toast.error("error in joining room " + error.message);
          console.log(error);
        }
      }
    }
  }

  async function createRoom() {
    if (validateForm()) {
      //create room
      console.log(detail);
      // call api to create room on backend
      try {
        const response = await createRoomApi(detail.roomId);
        console.log(response);
        toast.success("Room Created Successfully !!");
        //join the room
        setCurrentUser(detail.username);
        setRoomId(response.roomId);
        setConnected(true);

        navigate("/chat");

        //forward to chat page...
      } catch (error) {
        console.log(error);
        if (error.status == 400) {
          toast.error("Room  already exists !!");
        } else {
          toast("Error in creating room");
        }
      }
    }
  }

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-5xl min-h-[70%] bg-zinc-800 rounded-lg flex flex-col lg:flex-row items-center justify-between">
        {/* Left Section */}
        <div className="w-full lg:w-[40%] h-full flex flex-col items-center justify-center p-6">
          <DotLottieReact
            src="https://lottie.host/56382583-14f8-4cb2-b958-56c0262e2d53/UkptLjG6hZ.lottie"
            loop
            autoplay
            className="max-w-[250px] w-full mx-auto"
          />
          <h1 className="text-white text-2xl sm:text-3xl font-bold text-center lg:text-left mt-4">
            Welcome Buddy ...
          </h1>
          <p className="text-slate-300 text-center lg:text-left mt-3 text-sm sm:text-base">
            Welcome to your secured chat room, here your privacy is our duty.
          </p>
        </div>

        {/* Right Section */}
        <div className="bg-zinc-700 w-full lg:w-[60%] rounded-b-lg lg:rounded-r-lg lg:rounded-bl-none h-full px-6 sm:px-10 py-10">
          <div className="flex flex-col justify-center items-center h-full">
            <form className="w-full max-w-sm">
              <h2 className="text-2xl sm:text-3xl text-slate-100 font-bold mb-6 text-center lg:text-left">
                Create / Join Room
              </h2>

              {/* Username */}
              <div className="mb-4">
                <label
                  className="block text-slate-300 text-sm sm:text-base mb-2"
                  htmlFor="username"
                >
                  Username
                </label>
                <input
                  onChange={handleFormInputChange}
                  value={detail.username}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 border bg-slate-300 border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-950"
                  type="text"
                  id="username"
                  name="username"
                  required
                />
              </div>

              {/* Room ID */}
              <div className="mb-6">
                <label
                  className="block text-slate-300 text-sm sm:text-base mb-2"
                  htmlFor="roomId"
                >
                  Room ID
                </label>
                <input
                  onChange={handleFormInputChange}
                  value={detail.roomId}
                  placeholder="Enter Room ID correctly"
                  className="w-full px-3 py-2 border bg-slate-300 border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-950"
                  type="password"
                  id="roomId"
                  name="roomId"
                  required
                />
              </div>

              {/* Buttons */}
              <button
                onClick={joinRoom}
                type="button"
                className="w-full bg-zinc-600 text-white font-semibold m-2 py-2 px-4 rounded-xl hover:bg-[#FF4F5B] transition duration-200"
              >
                Join Room
              </button>
              <button
                onClick={createRoom}
                type="button"
                className="w-full bg-zinc-600 text-white font-semibold m-2 py-2 px-4 rounded-xl hover:bg-[#FF4F5B] transition duration-200"
              >
                Create Room
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinCreateChat;
