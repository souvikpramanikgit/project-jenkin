import './index.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faStar, faWrench } from '@fortawesome/free-solid-svg-icons'

const TaskElement = (props) => {
    const {details, deleteAnElement, changeEditingStatus} = props 
    const {id, taskDetail, lastDate, isGettingEdited} = details 

    const deleteItem = () => {
        deleteAnElement(id)
    }

    const changeInEditStatus = () => {
        changeEditingStatus(id)
    }

    return (
        <div className="outerDiv">
            <div className='combiner'>
                <div>
                    {!isGettingEdited && <p>{lastDate}</p>}
                    {isGettingEdited && <input value={lastDate} className='inside' readOnly />}
                </div>
                <div>
                    {!isGettingEdited && <p>{taskDetail}</p>}
                    {isGettingEdited && <input value={taskDetail} className='inside' readOnly />}
                </div>
            </div>
            <div className='bottomDiv'>
                <div>
                <button className='specialBtn' type="button" onClick={deleteItem}>
                <FontAwesomeIcon className='icon' icon={faTrash} />
                </button>
                </div>
                <div>
                    <button className='specialBtn' type="button" onClick={changeInEditStatus}>
                    <FontAwesomeIcon className='icon' icon={faWrench} />
                    </button>
                </div>
                <div>
                <FontAwesomeIcon className='icon' icon={faStar} />
                </div>
            </div>
        </div>
    )
}

export default TaskElement 