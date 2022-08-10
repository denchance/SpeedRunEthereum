import React, { useState } from "react";
import axios from "axios";
import { chakra, useToast, Button } from "@chakra-ui/react";
import { SERVER_URL as serverUrl } from "../constants";

const serverPath = "/bg/join";

export default function JoinBG({ text, connectedBuilder, isChallengeLocked, address, userProvider }) {
  const [isJoining, setIsJoining] = useState(false);
  // Optimistic update.
  const [joined, setJoined] = useState(false);
  const toast = useToast({ position: "top", isClosable: true });

  const onJoin = async () => {
    setIsJoining(true);

    let signMessage;
    try {
      const signMessageResponse = await axios.get(`${serverUrl}/sign-message`, {
        params: {
          messageId: "bgJoin",
          address,
        },
      });

      signMessage = signMessageResponse.data;
    } catch (error) {
      toast({
        description: "Can't get the message to sign. Please try again",
        status: "error",
      });
      setIsJoining(false);
      return;
    }

    let signature;
    try {
      signature = await userProvider.send("personal_sign", [signMessage, address]);
    } catch (error) {
      toast({
        status: "error",
        description: "The signature was cancelled",
      });
      console.error(error);
      setIsJoining(false);
      return;
    }

    try {
      await axios.post(
        serverUrl + serverPath,
        {
          signature,
        },
        {
          headers: {
            address,
          },
        },
      );
    } catch (error) {
      toast({
        status: "error",
        description: error?.response?.data ?? "Submission Error. Please try again.",
      });
      console.error(error);
      setIsJoining(false);

      return;
    }

    toast({
      status: "success",
      description: "You are now a member of the BuidlGuidl :)",
    });
    setIsJoining(false);
    setJoined(true);
  };

  const builderAlreadyJoined = !!connectedBuilder?.joinedBg;

  return (
    <Button
      onClick={onJoin}
      isLoading={isJoining}
      isDisabled={isChallengeLocked || builderAlreadyJoined || joined}
      variant={isChallengeLocked ? "outline" : "solid"}
      isFullWidth
      isExternal
    >
      <chakra.span>{builderAlreadyJoined || joined ? "Already joined" : text}</chakra.span>
    </Button>
  );
}
