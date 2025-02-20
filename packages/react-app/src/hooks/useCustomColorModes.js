import { useColorModeValue } from "@chakra-ui/react";

const useCustomColorModes = () => {
  const primaryFontColor = useColorModeValue("gray.700", "gray.200");
  const codeFontColor = primaryFontColor;
  const secondaryFontColor = useColorModeValue("gray.600", "gray.400");
  const dividerColor = useColorModeValue("gray.200", "gray.700");
  const borderColor = dividerColor;
  const codeBgColor = useColorModeValue("gray.100", "gray.900");
  const iconBgColor = codeBgColor;
  const linkColor = useColorModeValue("#088484", "#C8F5FF");

  return {
    primaryFontColor,
    secondaryFontColor,
    dividerColor,
    borderColor,
    codeFontColor,
    codeBgColor,
    iconBgColor,
    linkColor,
  };
};

export default useCustomColorModes;
