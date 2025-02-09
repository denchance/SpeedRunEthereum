import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useToast, useColorModeValue, Container, SimpleGrid, GridItem } from "@chakra-ui/react";
import BuilderProfileCard from "../components/builder/BuilderProfileCard";
import { challengeInfo } from "../data/challenges";
import { BG_BACKEND_URL as bgBackendUrl } from "../constants";
import { getAcceptedChallenges } from "../helpers/builders";
import { getChallengeEventsForUser } from "../data/api";
import { byTimestamp } from "../helpers/sorting";
import { JoinedBuidlGuidlBanner } from "../components/builder/JoinedBuidlGuidlBanner";
import { BuilderProfileHeader } from "../components/builder/BuilderProfileHeader";
import { BuilderChallenges } from "../components/builder/BuilderChallenges";
import { JoinBuidlGuidlBanner } from "../components/builder/JoinBuidlGuidlBanner";
import { CHALLENGE_SUBMISSION_STATUS } from "../helpers/constants";

export default function BuilderProfileView({
  serverUrl,
  mainnetProvider,
  address,
  userProvider,
  userRole,
  fetchUserData,
  connectedBuilder,
}) {
  const { builderAddress } = useParams();
  const [builder, setBuilder] = useState();
  const [challengeEvents, setChallengeEvents] = useState([]);
  const [isLoadingBuilder, setIsLoadingBuilder] = useState(false);
  const [isBuilderOnBg, setIsBuilderOnBg] = useState(false);
  const [isLoadingTimestamps, setIsLoadingTimestamps] = useState(false);
  const toast = useToast({ position: "top", isClosable: true });
  const toastVariant = useColorModeValue("subtle", "solid");
  let challenges = builder?.challenges ? Object.entries(builder.challenges) : undefined;
  if (challenges) {
    challenges = challenges.sort((a, b) => {
      const [aChallenge] = a;
      const [bChallenge] = b;
      return challengeInfo[aChallenge].id > challengeInfo[bChallenge].id ? 1 : -1;
    });
  }
  const acceptedChallenges = getAcceptedChallenges(builder?.challenges);
  const isMyProfile = builderAddress === address;

  const fetchBuilder = async () => {
    setIsLoadingBuilder(true);
    const fetchedBuilder = await axios.get(serverUrl + `/builders/${builderAddress}`);
    setBuilder(fetchedBuilder.data);

    try {
      await axios.get(bgBackendUrl + `/builders/${builderAddress}`);
    } catch (e) {
      // Builder Not found in BG
      setIsLoadingBuilder(false);
      return;
    }

    setIsBuilderOnBg(true);
    setIsLoadingBuilder(false);
  };

  useEffect(() => {
    fetchBuilder();
    // eslint-disable-next-line
  }, [builderAddress]);

  useEffect(() => {
    if (!builderAddress) {
      return;
    }

    async function fetchChallengeEvents() {
      setIsLoadingTimestamps(true);
      try {
        const fetchedChallengeEvents = await getChallengeEventsForUser(builderAddress);
        setChallengeEvents(fetchedChallengeEvents.sort(byTimestamp).reverse());
        setIsLoadingTimestamps(false);
      } catch (error) {
        toast({
          description: "Can't get challenges metadata. Please try again",
          status: "error",
          variant: toastVariant,
        });
      }
    }
    fetchChallengeEvents();
    // eslint-disable-next-line
  }, [builderAddress]);

  const builderAttemptedChallenges = useMemo(() => {
    if (!connectedBuilder?.challenges) {
      return [];
    }

    return Object.fromEntries(
      Object.entries(connectedBuilder.challenges).filter(([_, challengeData]) => challengeData?.status),
    );
  }, [connectedBuilder]);

  const bgChallenge = challengeInfo["buidl-guidl"];
  const isAllowedToJoinBg = bgChallenge.dependencies?.every(id => {
    if (!builderAttemptedChallenges[id]) {
      return false;
    }
    if (!(builderAttemptedChallenges[id].status === CHALLENGE_SUBMISSION_STATUS.ACCEPTED)) {
      return false;
    }

    return true;
  });

  return (
    <Container maxW="container.xl">
      <SimpleGrid gap={14} columns={{ base: 1, xl: 4 }}>
        <GridItem colSpan={1}>
          <BuilderProfileCard
            builder={builder}
            mainnetProvider={mainnetProvider}
            isMyProfile={isMyProfile}
            userProvider={userProvider}
            fetchBuilder={() => {
              fetchBuilder();
              fetchUserData();
            }}
            userRole={userRole}
          />
        </GridItem>
        {isBuilderOnBg ? (
          <GridItem colSpan={{ base: 1, xl: 3 }}>
            <JoinedBuidlGuidlBanner builderAddress={builderAddress} />
          </GridItem>
        ) : (
          <GridItem colSpan={{ base: 1, xl: 3 }}>
            <BuilderProfileHeader acceptedChallenges={acceptedChallenges} builder={builder} />
            {isMyProfile && isAllowedToJoinBg && (
              <JoinBuidlGuidlBanner
                challenge={bgChallenge}
                connectedBuilder={connectedBuilder}
                userProvider={userProvider}
                onJoinCallback={fetchBuilder}
              />
            )}
            <BuilderChallenges
              challenges={challenges}
              challengeEvents={challengeEvents}
              isMyProfile={isMyProfile}
              isLoadingBuilder={isLoadingBuilder}
              isLoadingTimestamps={isLoadingTimestamps}
            />
          </GridItem>
        )}
      </SimpleGrid>
    </Container>
  );
}
