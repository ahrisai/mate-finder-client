import React from 'react';

export const messageToLink = (message: string): React.ReactNode => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const isLink = message.match(urlRegex);

  if (isLink) {
    return (
      <a target='_blank' href={message}>
        {message}
      </a>
    );
  } else {
    return message;
  }
};
