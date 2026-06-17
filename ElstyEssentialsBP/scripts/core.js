import { system, world, Player, BlockTypes, EnchantmentType, ItemStack, Entity, Container, Component, ScoreboardIdentity, Dimension, Block, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, EntityComponentTypes, InputButton } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData, FormCancelationReason } from "@minecraft/server-ui";

// Export system and other components as-is (like the reference implementation)
export { system, world, Player, Entity, BlockTypes, ItemStack, Block, Dimension, Container, Component, ScoreboardIdentity, ActionFormData, ModalFormData, MessageFormData, FormCancelationReason, EnchantmentType, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, EntityComponentTypes, InputButton };

// Re-export everything from @minecraft/server for convenience
export * from "@minecraft/server";
export * from "@minecraft/server-ui";