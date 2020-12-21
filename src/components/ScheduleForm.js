import styled from "styled-components";

export const ScheduleDetailForm = styled.form`
  display: block;
  position: absolute;
  left: 50%;
  top: 20%;
  transform: translateX(-50%);
  padding: 20px;
  z-index: 2;
  background: ${(props) => props.theme.secondaryColors.secondaryDarker};
  box-shadow: 1px 3px 5px gray;
  border-radius: 5px;
  color: white;
  font-size: ${(props) => props.theme.fontSizes.small};

  & input {
    margin-bottom: 5px;
    padding: 2px;
    outline: none;
    border: none;

    &:focus {
      background: ${(props) => props.theme.primaryColors.primaryLighter};
    }
  }

  & select {
    width: 100%;
    margin-bottom: 5px;
    padding: 2px;
    outline: none;
    border: none;
  }

  ${(props) =>
    !props.$isEdit &&
    `
    display: none;
  `}
`;

export const CloseButton = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  border: none;
  color: ${(props) => props.theme.primaryColors.primaryLighter};
  background: transparent;
  cursor: pointer;
`;

export const Button = styled.button`
  margin-top: 20px;
  padding: 5px 0px;
  width: 100%;
  background: ${(props) => props.theme.primaryColors.primaryLighter};
  color: ${(props) => props.theme.secondaryColors.secondaryDarker};

  border: none;
  border-radius: 5px;

  transition: all 1s ease;

  &:disabled {
    opacity: 0;
    width: 50%;
  }
`;