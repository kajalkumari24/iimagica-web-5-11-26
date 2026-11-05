import './App.css'
import RouteConfig from './RouteConfig'
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <RouteConfig/>
      <ToastContainer
        position="top-right" 
        autoClose={3000}     
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        draggable={false}
        closeButton={true}
        limit={3}
        transition={Slide}
        containerStyle={{ zIndex: 20000 }}
        toastStyle={{ pointerEvents: "auto" }}
        theme="dark"          // light, dark, colored
      />
    </>
  )
}

export default App
