import React, { useState, useTransition } from 'react';
import './App.css';
import ErrorBoundary from './ErrorBoundary';
// #region Utils Region
function fetchJson(url) {
  return fetch(url).then(resp => resp.json());
}

function createResource(asyncFunc) {
  let result;
  let status = "pending";
  let promise;
  promise = asyncFunc()
    .then(r => {
      status = "success";
      result = r
    })
    .catch((e) => {
      status = "error";
      result = e;
    });

  return {
    read() {
      switch (status) {
        case "pending":
          throw promise;
        case "error":
          throw result;
        default:
          return result;
      }
    }
  }
}

let githubResourceCache = {};

function getGithubResource(userName) {
  let githubResource = githubResourceCache[userName];
  if (!githubResource) {
    githubResource = createResource(() => fetchJson(`https://api.github.com/users/${userName}`));
    githubResourceCache[userName] = githubResource;
  }
  return githubResource;
}
// #endregion

// #region Dumb Components
function SearchBox({ onSearchClick = () => { } }) {
  const [userName, setUserName] = useState('');

  function handleChange(ev) {
    setUserName(ev.target.value);
  }

  function handleSearchClick() {
    onSearchClick(userName);
  }

  return (
    <div className="search-box">
      <input
        placeholder="Enter User Name..."
        type="text"
        value={userName} onChange={handleChange} />
      <button onClick={handleSearchClick}>Search</button>
    </div>
  )
}


function UserDetails({ githubResource }) {
  const userDetails = githubResource.read();

  return (
    <ul className="user-details">
      <li>User Id: {userDetails.login}</li>
      <li>Name: {userDetails.name}</li>
    </ul>
  );
}
// #endregion Dumb Components

const SUSPENSE_CONFIG = {
  timeoutMs: 4000,
  busyDelayMs: 300,
  busyMinDurationMs: 700
};

function App() {
  const [userName, setUserName] = useState('');
  const [startTransition, isPending] = useTransition(SUSPENSE_CONFIG);
  const [githubResource, setGithubResource] = React.useState(null);

  const onSearchClick = (newUserName) => {
    setUserName(newUserName);
    startTransition(() => {
      setGithubResource(getGithubResource(newUserName));
    });
  }

  return (
    <div className="App">
      <SearchBox onSearchClick={onSearchClick} />
      <div className={`details-container ${isPending ? 'details-loading' : ''}`}>
        {githubResource && <ErrorBoundary>
          <React.Suspense fallback={<div>Loading details for {userName}...</div>}>
            <UserDetails githubResource={githubResource} />
          </React.Suspense>
        </ErrorBoundary>}
      </div>
    </div>
  );
}

export default App;
