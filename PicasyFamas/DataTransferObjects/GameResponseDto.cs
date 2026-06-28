namespace PicasyFamas.DataTransferObjects
{
    public class GameResponseDto
    {
        public int GameId { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool IsFinished { get; set; }
    }
}
