import styled from "styled-components";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DragDropContext, Droppable } from "react-beautiful-dnd";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUtensils,
  faCampground,
  faHotel,
  faShoppingBag,
} from "@fortawesome/free-solid-svg-icons";

import { MEDIA_QUERY_SM } from "../../constants/break_point";
import PostItItem from "../../components/PostItItem";
import DayLists from "./DayLists";
import ScheduleAddForm from "./ScheduleAddForm";
import ScheduleUpdateForm from "./ScheduleUpdateForm";
import MapArea from "./Map";
import {
  setEditId,
  setOrderByStartRoutines,
  addFromPostIt,
  deleteSpot,
} from "../../redux/reducers/schedulesReducer";
import {
  setOriginalColumns,
  setDestinationColumn,
  setIsScheduled,
} from "../../redux/reducers/postItsReducer";

const PlanWrapper = styled.div`
  display: flex;
  height: 100vh;

  ${MEDIA_QUERY_SM} {
    flex-direction: column;
  }
`;

const ScheduleWrapper = styled.div`
  display: flex;
  z-index: 1;
`;

const Schedule = styled.div`
  padding: 20px;
  min-width: 260px;
  background: ${(props) =>
    props.isDraggingOver
      ? props.theme.basicColors.white
      : props.theme.primaryColors.primaryLighter};
  box-shadow: 2px 0 2px gray;

  ${MEDIA_QUERY_SM} {
    width: 100%;
    border-bottom: 3px solid black;
  }
`;

const ScheduleTitle = styled.div`
  text-align: center;
  font-size: ${(props) => props.theme.fontSizes.medium};
  color: ${(props) => props.theme.basicColors.white};
  text-shadow: 2px 1.2px ${(props) => props.theme.primaryColors.primary};
  font-style: italic;
  font-weight: bold;
`;

const ScheduleList = styled.ul``;

const ScheduleItemWrapper = styled.div`
  display: flex;
  justify-content: center;
  position: relative;

  & + & {
    margin-top: 10px;
  }
`;

const ScheduleCategory = styled.div`
  width: 20px;
  height: 36px;
  line-height: 36px;
  color: ${(props) => props.theme.primaryColors.primaryDarker};
  background: transparent;
`;

const ScheduleItem = styled.li`
  margin-left: 5px;
  padding: 0 10px;
  width: 120px;
  height: 36px;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
  background: ${(props) => props.theme.primaryColors.primaryDark};
  text-align: center;
  line-height: 36px;
  font-size: ${(props) => props.theme.fontSizes.small};
  color: white;
  cursor: pointer;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  transition: all 0.5s ease-out;

  & + & {
    margin-top: 10px;
  }

  &:hover {
    background: ${(props) => props.theme.primaryColors.primaryDarker};
  }
`;

const ScheduleTimeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2px;
  border: 1px solid ${(props) => props.theme.primaryColors.primaryDark};
  border-left: none;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  height: 36px;
  color: ${(props) => props.theme.primaryColors.primaryDark};
`;

const ScheduleTime = styled.div`
  width: 32px;
  text-align: center;
  font-size: ${(props) => props.theme.fontSizes.extraSmall};
`;

const DeleteButton = styled.button`
  display: block;
  border: none;
  color: ${(props) => props.theme.primaryColors.primary};
  background: transparent;
`;

const SchedulePlus = styled.button`
  display: block;
  margin: auto;
  width: 120px;
  border: none;
  background: none;
  color: ${(props) => props.theme.primaryColors.primary};
  font-size: ${(props) => props.theme.fontSizes.large};
`;

export default function PlanningPage() {
  const dispatch = useDispatch();
  const [editRoutine, setEditRoutine] = useState(null);
  const [editIndex, setEditIndex] = useState(null);

  const dailyRoutines = useSelector((store) => store.schedules.dailyRoutines);
  const orderByStartRoutines = useSelector(
    (store) => store.schedules.orderByStartRoutines
  );
  const currentDate = useSelector((store) => store.schedules.currentDate);
  const editId = useSelector((store) => store.schedules.editId);

  const columns = useSelector((store) => store.postIts.columns);
  const spots = useSelector((store) => store.postIts.spots);

  useEffect(() => {
    dispatch(setEditId(null));
  }, [currentDate, dispatch]);

  useEffect(() => {
    // 根據 start 排列
    if (currentDate && dailyRoutines) {
      const orderRoutines = dailyRoutines[currentDate].slice();
      orderRoutines.sort(function (a, b) {
        return a.start - b.start;
      });
      dispatch(setOrderByStartRoutines(orderRoutines));
    }
  }, [dailyRoutines, currentDate, dispatch]);

  function handleScheduleItemClick(index, routine) {
    setEditRoutine(routine);
    setEditIndex(index);
    editId === index ? dispatch(setEditId(null)) : dispatch(setEditId(index));
  }

  function handleSchedulePlusClick() {
    // 要跳新增框（ScheduleAddForm）
    editId === "add" ? dispatch(setEditId(null)) : dispatch(setEditId("add"));
  }

  // 刪除
  function handleDeleteClick(id) {
    const index = dailyRoutines[currentDate].findIndex(
      (routine) => routine.id === id
    );
    dispatch(deleteSpot(index));
    if (dailyRoutines[currentDate][index].postItId) {
      const postItId = dailyRoutines[currentDate][index].postItId;
      dispatch(setIsScheduled(postItId));
    }
  }

  function onDragEnd(result) {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // 有不同的 column
    const startColumn = columns[source.droppableId];
    const finishColumn = columns[destination.droppableId];

    if (startColumn === finishColumn) {
      // 在原 column 裡移動
      const newSpotsIds = Array.from(startColumn.spotsIds); // 避免改變原 array
      newSpotsIds.splice(source.index, 1);
      newSpotsIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        spotsIds: newSpotsIds,
      };

      return dispatch(setOriginalColumns(source.droppableId, newColumn));
    }

    const finishSpotsIds = Array.from(finishColumn.spotsIds);
    finishSpotsIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...finishColumn,
      spotsIds: finishSpotsIds,
    };

    const spotId = startColumn.spotsIds[source.index]; // 拖曳的 spot id
    const draggingSpot = spots[spotId];
    const start = currentDate;
    const end = currentDate;
    const { location, category, memo, id } = draggingSpot;
    dispatch(
      addFromPostIt({
        location,
        category,
        start,
        end,
        memo,
        id,
      })
    );

    dispatch(
      setDestinationColumn(destination.droppableId, newFinish, draggingSpot)
    );
  }

  return (
    //  DropDragContext
    <DragDropContext onDragEnd={onDragEnd}>
      <PlanWrapper>
        {!dailyRoutines && <div>loading</div>}
        {dailyRoutines && (
          <ScheduleWrapper>
            <DayLists />

            <Droppable droppableId={"dailyRoutine"}>
              {(provided, snapshot) => (
                <Schedule
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  isDraggingOver={snapshot.isDraggingOver}
                >
                  <ScheduleTitle>
                    {new Date(currentDate).toLocaleString([], {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </ScheduleTitle>

                  <ScheduleList>
                    {orderByStartRoutines.map((routine, index) => (
                      <ScheduleItemWrapper key={index}>
                        <ScheduleCategory>
                          {routine.category === "hotel" && (
                            <FontAwesomeIcon icon={faHotel} />
                          )}
                          {routine.category === "shopping" && (
                            <FontAwesomeIcon icon={faShoppingBag} />
                          )}
                          {routine.category === "food" && (
                            <FontAwesomeIcon icon={faUtensils} />
                          )}
                          {routine.category === "attraction" && (
                            <FontAwesomeIcon icon={faCampground} />
                          )}
                        </ScheduleCategory>
                        <ScheduleItem
                          onClick={() => {
                            handleScheduleItemClick(index, routine);
                          }}
                        >
                          {routine.location}
                        </ScheduleItem>
                        <ScheduleTimeWrapper>
                          <ScheduleTime>
                            {routine.start &&
                              new Date(routine.start).toLocaleTimeString([], {
                                timeStyle: "short",
                                hour12: false,
                              })}
                          </ScheduleTime>
                          <ScheduleTime>
                            {routine.end &&
                              new Date(routine.end).toLocaleTimeString([], {
                                timeStyle: "short",
                                hour12: false,
                              })}
                          </ScheduleTime>
                        </ScheduleTimeWrapper>

                        {/* 刪除 */}
                        <DeleteButton
                          onClick={() => handleDeleteClick(routine.id)}
                        >
                          ✖
                        </DeleteButton>
                      </ScheduleItemWrapper>
                    ))}

                    {/* 新增 */}
                    <ScheduleAddForm />
                    <SchedulePlus onClick={handleSchedulePlusClick}>
                      +
                    </SchedulePlus>
                  </ScheduleList>

                  {provided.placeholder}
                </Schedule>
              )}
            </Droppable>
          </ScheduleWrapper>
        )}

        {editRoutine && (
          <ScheduleUpdateForm editIndex={editIndex} editRoutine={editRoutine} />
        )}

        <MapArea />

        <PostItItem />
      </PlanWrapper>
    </DragDropContext>
  );
}
