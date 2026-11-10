using System.ComponentModel.DataAnnotations;

namespace HomeBudget.API.DTOs
{
    public class ExpenseCreateDto
    {
        [Range(1, int.MaxValue)]
        public int FamilyMemberId { get; set; }

        [Range(1, int.MaxValue)]
        public int ExpenseCategoryId { get; set; }

        [Range(typeof(decimal), "0.001", "999999999999999.999")]
        public decimal Amount { get; set; }

        [Required]
        public DateTime? ExpenseDate { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }
}