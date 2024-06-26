import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  :root {
    --main-text-color: #dedede;
    --main-red-color: #8f2121;
    --orange-color: #fe8205;

  }
*{
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  list-style: none;

}
html{
    scrollbar-gutter: stable;
}
body{
  background-color:#1a1a1d;
    font-family: 'montserrat';
    padding: 0 !important;



}


  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background-color: #565656;
    
  }

  &::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #707070;
    border-radius: 10px;
    &:hover{
      cursor: grab;
    }
    &:active{
      cursor: grabbing;

    }
  }

`;

export default GlobalStyle;
