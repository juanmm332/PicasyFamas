using PicasyFamas.Models;
using System;
using System.Threading.Tasks;

namespace PicasyFamas.Services
{
    public interface IGameService
    {
        Task<Player?> RegisterPlayerAsync(string firstname, string lastname, int age, string email, string password);
        Task<Player?> GetPlayerByEmailAsync(string email);
        Task<Game?> StartGameAsync(Guid playerId);
        Task<Game?> GetActiveGameByPlayerIdAsync(Guid playerId);
        Task<Game?> GetGameByIdAsync(int gameId);
        Task<Attempt> ProcessGuessAsync(Game game, string attemptedNumberStr);
    }
}