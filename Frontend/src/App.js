import { Component } from 'react'
import TaskElement from './TaskElement'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faListCheck } from '@fortawesome/free-solid-svg-icons'

import './App.css';

class App extends Component {
  state = { tasksList: [], taskInput: '', dateInput: '', isInUpdation:false, idOfUpdatingElement:'' }

  changeTask = (event) => {
    const { value } = event.target
    this.setState((prevState) => ({
      tasksList: prevState.tasksList,
      taskInput: value,
      dateInput: prevState.dateInput,
      isInUpdation: prevState.isInUpdation,
      idOfUpdatingElement: prevState.idOfUpdatingElement
    }))
  }

  changeDate = (event) => {
    const { value } = event.target
    this.setState((prevState) => ({
      tasksList: prevState.tasksList,
      taskInput: prevState.taskInput,
      dateInput: value
    }))
  }

  componentDidMount = async () => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/printTable`, {
      method: "GET", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Method': 'GET',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    });
    const jsonData = await response.json();
    console.log(jsonData);
    this.setState((prevState) => ({
      tasksList: jsonData.map((eachItem) => {
        const newItem = {
          id: eachItem.id,
          taskDetail: eachItem.taskDetail,
          lastDate: eachItem.lastDate,
          isGettingEdited: false
        }
        return newItem
      }),
      taskInput: prevState.taskInput,
      dateInput: prevState.dateInput
    }))
  }

  createNewTask = async () => {
    const { taskInput, dateInput } = this.state
    const dataToBeSent = {
      taskDetail: taskInput,
      lastDate: dateInput
    }

    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/insertData`, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Method': 'GET',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(dataToBeSent)
    });
    const jsonData = await response.json();
    this.setState((prevState) => ({
      tasksList: jsonData.map((eachItem) => {
        const newItem = {
          id: eachItem.id,
          taskDetail: eachItem.taskDetail,
          lastDate: eachItem.lastDate,
          isGettingEdited: false
        }
        return newItem
      }),
      taskInput: prevState.taskInput,
      dateInput: prevState.dateInput
    }))
  }

  updateATask = async () => {
    console.log("updateATask Called")
    const {idOfUpdatingElement, dateInput, taskInput} = this.state 
    const dataToBeSent = {
      taskDetail: taskInput,
      lastDate: dateInput
    }
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/change/task/${idOfUpdatingElement}`, {
      method: "PUT", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json', 
        'Access-Control-Request-Method': 'GET',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(dataToBeSent)
    });
    const jsonData = await response.json();
    this.setState((prevState) => ({
      tasksList: jsonData.map((eachItem) => {
        const newItem = {
          id: eachItem.id,
          taskDetail: eachItem.taskDetail,
          lastDate: eachItem.lastDate,
          isGettingEdited: false
        }
        return newItem
      }),
      taskInput: '',
      dateInput: '',
      idOfUpdatingElement: '',
      isInUpdation: false
    }))
  }

  formSubmited = (event) => {
    if (event && event.preventDefault) event.preventDefault()
    const {isInUpdation} = this.state 
    if(isInUpdation){
      this.updateATask();
    }else{
      this.createNewTask();
    }
  }

  deleteAnElement = async (id) => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/delete/task/${id}`, {
      method: "DELETE", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Method': 'GET',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    });
    const jsonData = await response.json()
    this.setState((prevState) => ({
      tasksList: jsonData,
      taskInput: prevState.taskInput,
      dateInput: prevState.dateInput
    }))
  }

  changeEditingStatus = (id) => {
    this.setState((prevState) => ({
      tasksList: prevState.tasksList.map((eachItem) => {
          if(eachItem.id === id){
            const temp = !eachItem.isGettingEdited
            return ({...eachItem, isGettingEdited: temp});
          }
          return eachItem;
      }),
      taskInput: prevState.tasksList.filter((eachItem) => (eachItem.id === id))[0].taskDetail,
      dateInput: prevState.tasksList.filter((eachItem) => (eachItem.id === id))[0].lastDate,
      idOfUpdatingElement: id,
      isInUpdation: true
    }))
  }

  render() {
    const { tasksList, taskInput, dateInput, idOfUpdatingElement, isInUpdation } = this.state
    return (
      <div className="App">
        <div className="innerDiv">
          <div className="innerDivChild1">
            <form onSubmit={this.formSubmited}>
              <h1><FontAwesomeIcon icon={faListCheck} /></h1>
              <h4>Create a New Task</h4>
              <hr />
              <label>Task</label>
              <input value={taskInput} onChange={this.changeTask} placeholder="enter Task topic" className="specialInput" type="text" />
              <label>Last Date</label>
              <input value={dateInput} onChange={this.changeDate} placeholder="choose the deadline" className="specialInput" type="date" />
              {isInUpdation && <label>Task Id</label>}
              {isInUpdation && <input className='specialInput' value={idOfUpdatingElement}/>}
              {!isInUpdation && <button className="createBtn" type="submit">Create</button>}
              {isInUpdation && <button className="createBtn" type="submit">Update</button>}
            </form>
          </div>
          <div className="innerDivChild2">
            {
              tasksList.map((eachItem) => <TaskElement changeEditingStatus={this.changeEditingStatus} deleteAnElement={this.deleteAnElement} key={eachItem.id} details={eachItem} />)
            }
          </div>
        </div>
      </div>
    );
  }
}

export default App;
