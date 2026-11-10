namespace HomeBudget.API.DTOs
{
    public class IncomeResponseDto
    {
        public int Id { get; set; }

        public int FamilyMemberId { get; set; }

        public string FamilyMemberName { get; set; } = string.Empty;

        public int IncomeSourceId { get; set; }

        public string IncomeSourceName { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public DateTime IncomeDate { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}