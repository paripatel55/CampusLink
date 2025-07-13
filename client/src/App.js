import './App.css';
import './HangoutRequests.css';
import HangoutRequestForm from './HangoutRequestForm';
// import HangoutRequestsList from './HangoutRequestsList';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>CampusLink</h1>
        <p>Find study buddies and hangout partners nearby!</p>
      </header>
      
      <main className="app-main">
        <HangoutRequestForm />
        {/* <HangoutRequestsList /> */}
      </main>
    </div>
  );
}

export default App;
