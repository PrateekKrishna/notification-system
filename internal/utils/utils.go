package utils

import "log/slog"

func FailOnError(logger *slog.Logger, err error, msg string) {
    if err != nil {
        logger.Error(msg, "error", err)
        panic(err)
    }
}